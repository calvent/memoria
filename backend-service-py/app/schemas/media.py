"""媒体文件 Schemas"""
from datetime import datetime
from app.schemas.base import APIModel


class MediaResponse(APIModel):
    """媒体文件响应"""
    id: int
    user_id: int
    type: str
    url: str
    filename: str | None = None
    size: int | None = None
    mime_type: str | None = None
    created_at: datetime | None = None
