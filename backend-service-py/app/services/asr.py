"""ASR 语音识别服务 - 实时流式 WebSocket (OpenAI Realtime 协议)

支持两种后端:
- vllm: 自部署 vLLM (ws://host/v1/realtime)
- dashscope: 阿里云 DashScope (wss://dashscope.aliyuncs.com/api-ws/v1/realtime)

通过 ASR_PROVIDER 环境变量切换，默认 vllm

TODO: 后续迭代
- [ ] TTS 语音合成
- [ ] 方言识别
"""
import base64
import json
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator

import websockets

from app.config import settings


@dataclass
class _EventMap:
    """不同后端的事件名映射"""
    interim: str           # 中间识别结果
    interim_field: str     # 中间结果取文本的字段名
    final: str             # 最终识别结果
    final_field: str       # 最终结果取文本的字段名
    done: str | None       # 服务端会话结束事件 (None 表示无)


# vLLM 事件映射
_VLLM_EVENTS = _EventMap(
    interim="transcription.delta",
    interim_field="delta",
    final="transcription.done",
    final_field="text",
    done=None,
)

# DashScope 事件映射
_DASHSCOPE_EVENTS = _EventMap(
    interim="conversation.item.input_audio_transcription.text",
    interim_field="stash",
    final="conversation.item.input_audio_transcription.completed",
    final_field="transcript",
    done="session.finished",
)


class RealtimeASRProvider:
    """基于 OpenAI Realtime 协议的流式 ASR

    生命周期: connect → send_audio * N → finish → close
    识别结果通过 receive_transcripts() 异步生成器持续返回
    """

    def __init__(
        self,
        ws_url: str,
        headers: dict[str, str],
        session_update: dict,
        finish_events: list[dict],
        events: _EventMap,
    ):
        self._ws_url = ws_url
        self._headers = headers
        self._session_update = session_update
        self._finish_events = finish_events
        self._events = events
        self._ws: Any = None

    async def connect(self) -> None:
        """建立 WebSocket 连接并初始化识别任务"""
        self._ws = await websockets.connect(
            self._ws_url,
            additional_headers=self._headers or None,
        )
        # 等待 session.created
        msg = json.loads(await self._ws.recv())
        if msg.get("type") != "session.created":
            raise ConnectionError(f"ASR 握手失败: {msg}")
        # 发送 session.update
        await self._ws.send(json.dumps(self._session_update))

    async def send_audio(self, chunk: bytes) -> None:
        """发送一段音频 (PCM16/16kHz, 建议每 100ms 发一次)"""
        if not self._ws:
            return
        await self._ws.send(json.dumps({
            "type": "input_audio_buffer.append",
            "audio": base64.b64encode(chunk).decode(),
        }))

    async def finish(self) -> None:
        """通知 ASR 后端音频已发送完毕"""
        if not self._ws:
            return
        for event in self._finish_events:
            await self._ws.send(json.dumps(event))

    async def close(self) -> None:
        """关闭连接"""
        if self._ws:
            await self._ws.close()
            self._ws = None

    async def receive_transcripts(self) -> AsyncGenerator[dict, None]:
        """持续接收识别结果"""
        if not self._ws:
            return
        ev = self._events
        try:
            async for raw in self._ws:
                msg = json.loads(raw)
                msg_type = msg.get("type", "")

                if msg_type == ev.interim:
                    text = msg.get(ev.interim_field, "")
                    if text:
                        yield {"text": text, "is_final": False}

                elif msg_type == ev.final:
                    text = msg.get(ev.final_field, "")
                    if text:
                        yield {"text": text, "is_final": True}

                elif ev.done and msg_type == ev.done:
                    break

                elif msg_type == "error":
                    raise RuntimeError(f"ASR 错误: {msg}")
        except websockets.ConnectionClosed:
            pass


def create_asr_provider() -> RealtimeASRProvider:
    """根据配置创建 ASR provider"""
    provider = settings.asr_provider

    if provider == "vllm":
        base_url = settings.asr_vllm_url.rstrip("/")
        ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
        return RealtimeASRProvider(
            ws_url=f"{ws_url}/v1/realtime",
            headers={},
            session_update={
                "type": "session.update",
                "model": settings.asr_vllm_model,
            },
            finish_events=[
                {"type": "input_audio_buffer.commit", "final": True},
            ],
            events=_VLLM_EVENTS,
        )

    elif provider == "dashscope":
        if not settings.dashscope_api_key:
            raise ValueError("未配置 DASHSCOPE_API_KEY")
        return RealtimeASRProvider(
            ws_url=f"wss://dashscope.aliyuncs.com/api-ws/v1/realtime?model={settings.asr_dashscope_model}",
            headers={
                "Authorization": f"Bearer {settings.dashscope_api_key}",
                "OpenAI-Beta": "realtime=v1",
            },
            session_update={
                "type": "session.update",
                "session": {
                    "modalities": ["text"],
                    "input_audio_format": "pcm",
                    "sample_rate": 16000,
                    "input_audio_transcription": {"language": "zh"},
                    "turn_detection": None,
                },
            },
            finish_events=[
                {"type": "input_audio_buffer.commit"},
                {"type": "session.finish"},
            ],
            events=_DASHSCOPE_EVENTS,
        )

    else:
        raise ValueError(f"不支持的 ASR provider: {provider}，可选: vllm, dashscope")
