"""章节业务逻辑"""
import json
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Chapter, Memoir, Recording, Story
from app.schemas.chapter import ChapterCreate, ChapterUpdate, ChapterGenerate


TYPE_TITLES = {
    "introduction": "序言",
    "childhood": "童年",
    "youth": "青春",
    "adulthood": "成年",
    "family": "家庭",
    "career": "事业",
    "other": "其他",
}


async def _ensure_memoir_owner(db: AsyncSession, memoir_id: int, user_id: int) -> Memoir:
    stmt = select(Memoir).where(
        and_(Memoir.id == memoir_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    memoir = result.scalar_one_or_none()
    if not memoir:
        raise ValueError("回忆录不存在")
    return memoir


async def _ensure_chapter_owner(db: AsyncSession, chapter_id: int, user_id: int) -> Chapter:
    stmt = select(Chapter, Memoir).join(Memoir, Chapter.memoir_id == Memoir.id).where(
        and_(Chapter.id == chapter_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise ValueError("章节不存在")
    return row[0]


async def get_chapter_list(db: AsyncSession, memoir_id: int, user_id: int) -> list[Chapter]:
    await _ensure_memoir_owner(db, memoir_id, user_id)
    # 预加载 stories
    stmt = select(Chapter).options(
        selectinload(Chapter.stories)
    ).where(Chapter.memoir_id == memoir_id).order_by(Chapter.order)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_chapter_detail(db: AsyncSession, chapter_id: int, user_id: int) -> Chapter:
    # 确保拥有权，并加载 stories
    stmt = select(Chapter, Memoir).join(Memoir, Chapter.memoir_id == Memoir.id).options(
        selectinload(Chapter.stories)
    ).where(
        and_(Chapter.id == chapter_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise ValueError("章节不存在")
    return row[0]


async def get_public_chapter_detail(db: AsyncSession, chapter_id: int) -> Chapter:
    stmt = select(Chapter).options(
        selectinload(Chapter.memoir),
        selectinload(Chapter.recordings),
        selectinload(Chapter.stories)
    ).where(Chapter.id == chapter_id)
    
    result = await db.execute(stmt)
    chapter = result.scalars().first()
    
    if not chapter:
        raise ValueError("章节不存在")
    
    # 检查关联的回忆录状态
    if chapter.memoir.status != "completed":
        raise ValueError("回忆录未公开")
        
    return chapter


async def create_chapter(db: AsyncSession, user_id: int, data: ChapterCreate) -> Chapter:
    await _ensure_memoir_owner(db, data.memoir_id, user_id)

    count_stmt = select(func.coalesce(func.max(Chapter.order), 0)).where(
        Chapter.memoir_id == data.memoir_id
    )
    max_order = await db.scalar(count_stmt)
    next_order = int(max_order or 0) + 1

    chapter = Chapter(
        memoir_id=data.memoir_id,
        title=data.title,
        description=data.description,
        time_period=data.time_period,
        introduction=data.introduction,
        type=data.type,
        order=next_order,
        is_ai_generated=False,
    )
    db.add(chapter)
    await db.flush()
    return chapter


async def update_chapter(db: AsyncSession, chapter_id: int, user_id: int, data: ChapterUpdate) -> Chapter:
    chapter = await _ensure_chapter_owner(db, chapter_id, user_id)

    if data.title is not None:
        chapter.title = data.title
    if data.description is not None:
        chapter.description = data.description
    if data.time_period is not None:
        chapter.time_period = data.time_period
    if data.introduction is not None:
        chapter.introduction = data.introduction
    if data.type is not None:
        chapter.type = data.type
    if data.order is not None:
        chapter.order = data.order

    await db.flush()
    # 重新加载 stories 以便序列化返回
    await db.refresh(chapter, attribute_names=["stories"])
    return chapter


async def delete_chapter(db: AsyncSession, chapter_id: int, user_id: int) -> None:
    chapter = await _ensure_chapter_owner(db, chapter_id, user_id)
    await db.delete(chapter)


async def generate_chapter(db: AsyncSession, user_id: int, data: ChapterGenerate) -> Chapter:
    """基于 Story 生成章节 (占位，逻辑需更新)"""
    await _ensure_memoir_owner(db, data.memoir_id, user_id)
    
    # TODO: 实现基于 Story 的 AI 生成逻辑
    title = TYPE_TITLES.get(data.type, data.type)
    
    # 临时逻辑：创建一个空章节
    count_stmt = select(func.coalesce(func.max(Chapter.order), 0)).where(
        Chapter.memoir_id == data.memoir_id
    )
    max_order = await db.scalar(count_stmt)
    next_order = int(max_order or 0) + 1

    chapter = Chapter(
        memoir_id=data.memoir_id,
        title=title,
        type=data.type,
        order=next_order,
        is_ai_generated=True,
    )
    db.add(chapter)
    await db.flush()
    return chapter


def serialize_chapter(chapter: Chapter) -> dict:
    """章节序列化"""
    from app.schemas.chapter import ChapterResponse
    from app.schemas.story import StoryResponse
    
    stories_data = []
    if hasattr(chapter, "stories"):
        for story in chapter.stories:
            stories_data.append(StoryResponse(
                id=story.id,
                memoir_id=story.memoir_id,
                chapter_id=story.chapter_id,
                title=story.title,
                content=story.content,
                happened_at=story.happened_at,
                location=story.location,
                keywords=story.keywords,
                order=story.order,
                source=story.source,
                is_ai_processed=story.is_ai_processed,
                recording_id=story.recording_id,
                created_at=story.created_at,
                updated_at=story.updated_at
            ))
            
    # 兼容处理：如果没有 description，但有 introduction，用 introduction 填充描述（或者前端展示逻辑）
    
    return ChapterResponse(
        id=chapter.id,
        memoir_id=chapter.memoir_id,
        title=chapter.title,
        description=chapter.description,
        time_period=chapter.time_period,
        introduction=chapter.introduction,
        content=chapter.introduction or "", # 兼容旧字段
        order=chapter.order,
        type=chapter.type,
        stories=stories_data,
        is_ai_generated=chapter.is_ai_generated,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at,
    ).model_dump(by_alias=True)
