"""语音会话管理 + 录音保存"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from io import BytesIO

from app.config import settings
from app.core.storage import minio_client
from app.core.db import AsyncSessionLocal
from app.models import Recording
from app.services.asr import RealtimeASRProvider, create_asr_provider


@dataclass
class ASRSession:
    session_id: str
    user_id: str
    memoir_id: str | None = None
    chapter_id: str | None = None
    start_time: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
    audio_chunks: list[bytes] = field(default_factory=list)
    transcript_parts: list[str] = field(default_factory=list)  # 每句最终结果
    asr: RealtimeASRProvider | None = None  # ASR WebSocket 连接


class ASRSessionManager:
    def __init__(self):
        self.sessions: dict[str, ASRSession] = {}

    def create_session(
        self, user_id: str,
        memoir_id: str | None = None,
        chapter_id: str | None = None,
    ) -> ASRSession:
        from nanoid import generate
        session_id = generate()
        session = ASRSession(
            session_id=session_id,
            user_id=user_id,
            memoir_id=memoir_id,
            chapter_id=chapter_id,
        )
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> ASRSession | None:
        return self.sessions.get(session_id)

    async def close_session(self, session_id: str) -> None:
        session = self.sessions.pop(session_id, None)
        if session and session.asr:
            await session.asr.close()

    def get_full_transcript(self, session_id: str) -> str:
        """获取完整转写文本"""
        session = self.sessions.get(session_id)
        if not session:
            return ""
        return "".join(session.transcript_parts)

    def get_full_audio(self, session_id: str) -> bytes | None:
        session = self.sessions.get(session_id)
        if not session or not session.audio_chunks:
            return None
        return b"".join(session.audio_chunks)


session_manager = ASRSessionManager()


async def save_recording(
    session_id: str,
    user_id: str,
    memoir_id: str | None,
    chapter_id: str | None,
) -> str:
    session = session_manager.get_session(session_id)
    if not session:
        raise ValueError("会话不存在")

    audio = session_manager.get_full_audio(session_id)
    if not audio:
        raise ValueError("没有音频数据")

    duration_seconds = max(int(datetime.now(timezone.utc).timestamp() - session.start_time), 0)
    object_key = f"recordings/{user_id}/{session_id}.wav"

    minio_client.client.put_object(
        settings.minio_bucket_private,
        object_key,
        BytesIO(audio),
        length=len(audio),
        content_type="audio/wav",
    )

    audio_url = f"s3://{settings.minio_bucket_private}/{object_key}"
    transcript = session_manager.get_full_transcript(session_id)

    async with AsyncSessionLocal() as db:
        try:
            recording = Recording(
                user_id=int(user_id),
                memoir_id=int(memoir_id) if memoir_id else None,
                chapter_id=int(chapter_id) if chapter_id else None,
                audio_url=audio_url,
                duration=duration_seconds,
                transcription_text=transcript,
                transcription_status="completed",
            )
            db.add(recording)
            await db.commit()
            await db.refresh(recording)
            return str(recording.id)
        except Exception:
            await db.rollback()
            raise


# TODO: 后续迭代
# - [ ] TTS 语音合成
# - [ ] 方言识别
# - [ ] 音频降噪
