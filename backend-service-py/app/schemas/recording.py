"""录音相关 Schemas"""
from datetime import datetime
from app.schemas.base import APIModel


class RecordingCreate(APIModel):
    """创建录音请求"""
    memoir_id: int
    chapter_id: int | None = None
    audio_url: str
    duration: int | None = None
    dialect: str | None = None


class RecordingUpdateTranscription(APIModel):
    """更新转写请求"""
    recording_id: int
    text: str


class RecordingResponse(APIModel):
    """录音响应"""
    id: int
    memoir_id: int | None = None
    chapter_id: int | None = None
    user_id: int
    audio_url: str
    duration: int | None = None
    dialect: str | None = None
    transcription_text: str | None = None
    transcription_status: str
    created_at: datetime
    updated_at: datetime
