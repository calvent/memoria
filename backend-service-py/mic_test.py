#!/usr/bin/env python3
"""
实时麦克风语音转文字 (Auto-commit on silence + clean shutdown)
兼容 Qwen / OpenAI Realtime 风格事件:
- input_audio_buffer.append
- input_audio_buffer.commit
- input_audio_buffer.clear
- transcription.delta / transcription.done
"""

import asyncio
import base64
import json
import queue
import signal
import sys
import time

import numpy as np
import sounddevice as sd
import websockets


# -----------------------------
# 配置
# -----------------------------
WS_URL = "ws://127.0.0.1:8003/v1/realtime"
MODEL_NAME = "qwen3-asr"

SAMPLE_RATE = 16000
CHUNK_MS = 100
BLOCK_SIZE = int(SAMPLE_RATE * CHUNK_MS / 1000)

# 静音超过这个时间（ms）就 commit 一段
SILENCE_COMMIT_MS = 600

# 最长一段（ms），防止一直说不停导致永远不出 done
MAX_SEGMENT_MS = 8000

# 用于安全关闭：等待 ws.close 的最大时间（秒）
WS_CLOSE_TIMEOUT_S = 1.0


# -----------------------------
# 全局状态
# -----------------------------
audio_queue: "queue.Queue[bytes]" = queue.Queue()
stop_event = asyncio.Event()
last_audio_ts = time.monotonic()


def audio_callback(indata, frames, time_info, status):
    """sounddevice 回调（运行在独立线程）"""
    global last_audio_ts
    if status:
        print(status, file=sys.stderr)

    last_audio_ts = time.monotonic()
    pcm16 = (np.clip(indata, -1.0, 1.0) * 32767.0).astype(np.int16).tobytes()
    audio_queue.put(pcm16)


def setup_signal_handlers(loop: asyncio.AbstractEventLoop):
    """
    用信号触发 stop_event。
    - macOS/Linux: loop.add_signal_handler 可用
    - Windows: 可能不支持 add_signal_handler（用 KeyboardInterrupt 兜底）
    """
    def _ask_stop(signame: str):
        if not stop_event.is_set():
            print(f"\n🛑 收到 {signame}，正在停止...")
            stop_event.set()

    for sig, name in [(signal.SIGINT, "SIGINT"), (signal.SIGTERM, "SIGTERM")]:
        try:
            loop.add_signal_handler(sig, _ask_stop, name)
        except (NotImplementedError, RuntimeError):
            # Windows/某些环境不支持
            signal.signal(sig, lambda s, f, n=name: _ask_stop(n))


async def safe_ws_send(ws, payload: dict):
    """发送 WS 消息：退出阶段可能已断链，忽略异常以便快速退出"""
    try:
        await ws.send(json.dumps(payload))
    except Exception:
        pass


async def send_loop(ws):
    """发送音频：append；静音/超时自动 commit + clear"""
    print("🎤 正在录音... (Ctrl+C 退出)")

    bytes_since_commit = 0
    segment_start_ts = time.monotonic()

    try:
        while not stop_event.is_set():
            now = time.monotonic()

            # 1) 取音频块（短超时，保证能响应 stop）
            got = False
            try:
                pcm_bytes = audio_queue.get(timeout=0.05)
                got = True
            except queue.Empty:
                pass

            if got:
                b64 = base64.b64encode(pcm_bytes).decode("ascii")
                await safe_ws_send(ws, {
                    "type": "input_audio_buffer.append",
                    "audio": b64
                })
                bytes_since_commit += len(pcm_bytes)

                # ✅ 给事件循环/接收端留出调度空间
                await asyncio.sleep(CHUNK_MS / 1000.0)

            # 2) 判断是否需要 commit（静音或段落超时）
            silence_ms = (now - last_audio_ts) * 1000.0
            seg_ms = (now - segment_start_ts) * 1000.0

            should_commit = (
                bytes_since_commit > 0
                and (silence_ms >= SILENCE_COMMIT_MS or seg_ms >= MAX_SEGMENT_MS)
            )

            if should_commit:
                await safe_ws_send(ws, {"type": "input_audio_buffer.commit"})
                await safe_ws_send(ws, {"type": "input_audio_buffer.clear"})
                bytes_since_commit = 0
                segment_start_ts = time.monotonic()

        # 退出前尽量收尾一次
        if bytes_since_commit > 0:
            await safe_ws_send(ws, {"type": "input_audio_buffer.commit"})
            await safe_ws_send(ws, {"type": "input_audio_buffer.clear"})

    except asyncio.CancelledError:
        # 被 main 取消：快速退出
        return


async def recv_loop(ws):
    """接收识别结果：delta 实时打印，done 输出最终段落"""
    try:
        async for msg in ws:
            data = json.loads(msg)
            evt = data.get("type")

            if evt == "session.created":
                print("✅ 会话已创建")

            elif evt == "session.updated":
                print("✅ 会话已更新")

            elif evt == "transcription.delta":
                print(data.get("delta", ""), end="", flush=True)

            elif evt == "transcription.done":
                text = data.get("text", "")
                if text:
                    print("\n✅ [最终]:", text)

            elif evt == "error":
                print("\n❌ 服务端错误:", data)
                stop_event.set()
                break

    except asyncio.CancelledError:
        return
    except websockets.ConnectionClosed:
        # 正常关闭或被 abort
        return
    except Exception as e:
        if not stop_event.is_set():
            print(f"\n❌ 接收错误: {e}")


async def main():
    loop = asyncio.get_running_loop()
    setup_signal_handlers(loop)

    ws = None
    sender = receiver = None

    # 输入流：用 try/finally 确保退出时关闭
    input_stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32",
        blocksize=BLOCK_SIZE,
        callback=audio_callback,
    )

    try:
        print(f"🔗 连接 {WS_URL} ...")
        ws = await websockets.connect(WS_URL, max_size=10 * 1024 * 1024)

        # session.update：尽量用 session 字段（更通用）；若你的服务只认 model 字段，可改回 {"type":"session.update","model":MODEL_NAME}
        await safe_ws_send(ws, {
            "type": "session.update",
            "session": {"model": MODEL_NAME}
        })

        with input_stream:
            sender = asyncio.create_task(send_loop(ws), name="sender")
            receiver = asyncio.create_task(recv_loop(ws), name="receiver")

            # 等 stop（信号触发 / error 触发）
            await stop_event.wait()

    finally:
        # 1) 停麦克风（双保险）
        try:
            input_stream.stop()
            input_stream.close()
        except Exception:
            pass

        # 2) 取消任务（避免卡住）
        for t in (sender, receiver):
            if t and not t.done():
                t.cancel()

        # 3) 优雅关 ws（有超时）；不配合就 abort 强制退出
        if ws:
            try:
                await asyncio.wait_for(ws.close(), timeout=WS_CLOSE_TIMEOUT_S)
            except Exception:
                try:
                    # 强制断底层连接，避免 recv_loop 卡死
                    ws.transport.abort()
                except Exception:
                    pass

        # 4) 吸收取消/异常，保证退出干净
        for t in (sender, receiver):
            if t:
                try:
                    await t
                except asyncio.CancelledError:
                    pass
                except Exception:
                    pass


if __name__ == "__main__":
    # 依赖提示
    try:
        import numpy  # noqa
        import sounddevice  # noqa
        import websockets  # noqa
    except Exception:
        print("❌ 缺少依赖，请运行: pip install sounddevice numpy websockets")
        sys.exit(1)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        # Windows/某些环境下的兜底
        pass
