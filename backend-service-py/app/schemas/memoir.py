"""回忆录相关 Schemas"""
from app.schemas.base import APIModel
from datetime import datetime


class MemoirBase(APIModel):
    """回忆录基础字段"""
    title: str
    cover_image: str | None = None
    description: str | None = None
    elder_id: int | None = None


class MemoirCreate(MemoirBase):
    """创建回忆录"""
    pass


class MemoirUpdate(APIModel):
    """更新回忆录"""
    id: int | None = None
    title: str | None = None
    cover_image: str | None = None
    description: str | None = None
    elder_id: int | None = None
    status: str | None = None


class MemoirResponse(MemoirBase):
    """回忆录响应"""
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    elder_name: str | None = None  # 老人姓名
    elder_nickname: str | None = None  # 老人昵称
    chapter_count: int = 0  # 章节数量
