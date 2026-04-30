"""故事相关 Schemas"""
from datetime import datetime
from pydantic import computed_field
from app.schemas.base import APIModel


class StoryCreate(APIModel):
    """创建故事请求"""
    memoir_id: int
    chapter_id: int | None = None
    title: str
    content: str
    happened_at: str | None = None
    location: str | None = None
    keywords: str | None = None
    source: str = "manual"
    recording_id: int | None = None


class StoryUpdate(APIModel):
    """更新故事请求"""
    id: int | None = None
    chapter_id: int | None = None
    title: str | None = None
    content: str | None = None
    happened_at: str | None = None
    location: str | None = None
    keywords: str | None = None
    order: int | None = None
    recording_id: int | None = None


class StoryResponse(APIModel):
    """故事响应"""
    id: int
    memoir_id: int
    chapter_id: int | None = None
    title: str
    content: str
    happened_at: str | None = None
    location: str | None = None
    keywords: str | None = None
    order: int
    source: str
    is_ai_processed: bool
    recording_id: int | None = None
    created_at: datetime
    updated_at: datetime
    
    # 录音详情（可选，如果需要连表查）
    # recording: RecordingResponse | None = None
