"""实时语音识别 WebSocket 端点

数据流:
  前端 ──audio──▶ 后端 ──audio──▶ ASR 后端
  前端 ◀──text── 后端 ◀──text── ASR 后端

前端每 100ms 发一段音频，ASR 后端实时返回识别文本
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import verify_token
from app.services.asr import create_asr_provider
from app.services.speech import session_manager, save_recording


router = APIRouter()


@router.websocket("/speech/realtime")
async def realtime_asr(websocket: WebSocket):
    """
    实时语音识别 WebSocket

    客户端发送:
      - 二进制音频 (PCM16, 16kHz, 单声道)，建议每 100ms 发一次
      - {"type": "end"} 结束录音

    服务端返回:
      - {"type": "info", "message": "...", "sessionId": "..."}
      - {"type": "transcript", "text": "...", "is_final": false}  中间结果
      - {"type": "transcript", "text": "...", "is_final": true}   句子确认
      - {"type": "info", "message": "已保存", "recordingId": "..."}
      - {"type": "error", "error": "..."}
    """
    # --- 认证 ---
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = verify_token(token)
    except ValueError:
        await websocket.close(code=1008)
        return

    user_id = payload.get("user_id") or payload.get("userId")
    if not user_id:
        await websocket.close(code=1008)
        return

    memoir_id = websocket.query_params.get("memoir_id")
    chapter_id = websocket.query_params.get("chapter_id")

    await websocket.accept()

    # --- 创建会话 + 连接 ASR 后端 ---
    session = session_manager.create_session(str(user_id), memoir_id, chapter_id)
    asr = create_asr_provider()
    session.asr = asr

    try:
        await asr.connect()
    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "error": f"ASR 连接失败: {e}",
        }))
        await websocket.close()
        await session_manager.close_session(session.session_id)
        return

    await websocket.send_text(json.dumps({
        "type": "info",
        "message": "连接成功",
        "sessionId": session.session_id,
    }))

    # --- 转发 ASR 结果到前端 (后台任务) ---
    async def forward_transcripts():
        """持续接收 ASR 识别结果并转发给前端"""
        try:
            async for result in asr.receive_transcripts():
                text = result.get("text", "")
                is_final = result.get("is_final", False)

                # 收集最终结果
                if is_final and text:
                    session.transcript_parts.append(text)

                await websocket.send_text(json.dumps({
                    "type": "transcript",
                    "text": text,
                    "is_final": is_final,
                }))
        except Exception:
            pass  # 连接关闭时正常退出

    forward_task = asyncio.create_task(forward_transcripts())

    # --- 接收前端音频并转发到 ASR ---
    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            # 二进制音频 → 转发到 ASR
            if message.get("bytes"):
                chunk = message["bytes"]
                session.audio_chunks.append(chunk)
                await asr.send_audio(chunk)

            # 控制命令
            if message.get("text"):
                try:
                    cmd = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue

                if cmd.get("type") == "end":
                    # 通知 ASR 结束
                    await asr.finish()

                    # 等待剩余识别结果返回
                    try:
                        await asyncio.wait_for(forward_task, timeout=10.0)
                    except asyncio.TimeoutError:
                        pass

                    # 保存录音
                    try:
                        recording_id = await save_recording(
                            session.session_id,
                            str(user_id),
                            memoir_id,
                            chapter_id,
                        )
                        await websocket.send_text(json.dumps({
                            "type": "info",
                            "message": "已保存",
                            "recordingId": recording_id,
                        }))
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "error": f"保存失败: {e}",
                        }))
                    break

    except WebSocketDisconnect:
        pass
    finally:
        forward_task.cancel()
        await session_manager.close_session(session.session_id)
