"""章节相关 Schemas"""
from datetime import datetime
from pydantic import computed_field
from app.schemas.base import APIModel


from app.schemas.story import StoryResponse


class ChapterCreate(APIModel):
    """创建章节请求"""
    memoir_id: int
    title: str
    description: str | None = None
    time_period: str | None = None
    introduction: str | None = None
    type: str | None = None


class ChapterUpdate(APIModel):
    """更新章节请求"""
    id: int | None = None
    title: str | None = None
    description: str | None = None
    time_period: str | None = None
    introduction: str | None = None
    type: str | None = None
    order: int | None = None


class ChapterGenerate(APIModel):
    """AI 生成章节请求"""
    memoir_id: int
    type: str
    story_ids: list[int] | None = None  # 基于哪些故事生成


class ChapterDelete(APIModel):
    """删除章节请求"""
    id: int | None = None


class ChapterResponse(APIModel):
    """章节响应"""
    id: int
    memoir_id: int
    title: str
    description: str | None = None
    time_period: str | None = None
    introduction: str | None = None
    order: int
    type: str | None = None
    
    # 关联数据
    stories: list[StoryResponse] = []
    
    # 兼容旧字段（标记为废弃或映射到新字段）
    content: str | None = None # 可能会映射 introduction
    
    is_ai_generated: bool = False
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def status(self) -> str:
        return "completed" if self.is_ai_generated else "draft"
