"""录音业务逻辑"""
import re
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Recording, MediaFile
from app.schemas.recording import RecordingCreate


MEDIA_URL_PATTERN = re.compile(r"/api/v1/media/file/(?P<media_id>\d+)")


async def create_recording(db: AsyncSession, user_id: int, data: RecordingCreate) -> Recording:
    """创建录音记录"""
    audio_url = data.audio_url

    match = MEDIA_URL_PATTERN.search(audio_url)
    if match:
        media_id = int(match.group("media_id"))
        media = await db.get(MediaFile, media_id)
        if media and media.user_id == user_id:
            audio_url = media.url

    recording = Recording(
        user_id=user_id,
        memoir_id=data.memoir_id,
        chapter_id=data.chapter_id,
        audio_url=audio_url,
        duration=data.duration,
        dialect=data.dialect,
        transcription_status="pending",
    )

    db.add(recording)
    await db.flush()
    return recording


async def get_recording_detail(db: AsyncSession, recording_id: int, user_id: int) -> Recording:
    """获取录音详情"""
    stmt = select(Recording).where(
        and_(Recording.id == recording_id, Recording.user_id == user_id)
    )
    result = await db.execute(stmt)
    recording = result.scalar_one_or_none()

    if not recording:
        raise ValueError("录音不存在")

    return recording


async def update_transcription(db: AsyncSession, recording_id: int, user_id: int, text: str) -> None:
    """更新转写文本"""
    recording = await get_recording_detail(db, recording_id, user_id)
    recording.transcription_text = text
    recording.transcription_status = "completed"
    await db.flush()


async def delete_recording(db: AsyncSession, recording_id: int, user_id: int) -> None:
    """删除录音"""
    recording = await get_recording_detail(db, recording_id, user_id)
    await db.delete(recording)
