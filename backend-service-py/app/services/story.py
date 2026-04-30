"""故事业务逻辑"""
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Story, Chapter, Memoir, Recording
from app.schemas.story import StoryCreate, StoryUpdate


async def _ensure_memoir_owner(db: AsyncSession, memoir_id: int, user_id: int) -> Memoir:
    stmt = select(Memoir).where(
        and_(Memoir.id == memoir_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    memoir = result.scalar_one_or_none()
    if not memoir:
        raise ValueError("回忆录不存在")
    return memoir


async def _ensure_story_owner(db: AsyncSession, story_id: int, user_id: int) -> Story:
    stmt = select(Story, Memoir).join(Memoir, Story.memoir_id == Memoir.id).where(
        and_(Story.id == story_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise ValueError("故事不存在")
    return row[0]


async def get_stories_by_chapter(db: AsyncSession, chapter_id: int, user_id: int) -> list[Story]:
    """获取章节下的故事"""
    stmt = select(Chapter, Memoir).join(Memoir, Chapter.memoir_id == Memoir.id).where(
        and_(Chapter.id == chapter_id, Memoir.user_id == user_id)
    )
    result = await db.execute(stmt)
    if not result.first():
        raise ValueError("章节不存在")

    stmt = select(Story).where(Story.chapter_id == chapter_id).order_by(Story.order)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_uncategorized_stories(db: AsyncSession, memoir_id: int, user_id: int) -> list[Story]:
    """获取回忆录中未分类的故事"""
    await _ensure_memoir_owner(db, memoir_id, user_id)
    
    stmt = select(Story).where(
        and_(Story.memoir_id == memoir_id, Story.chapter_id.is_(None))
    ).order_by(Story.created_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_story(db: AsyncSession, user_id: int, data: StoryCreate) -> Story:
    await _ensure_memoir_owner(db, data.memoir_id, user_id)
    
    # 如果指定了章节，计算排序
    order = 0
    if data.chapter_id:
        count_stmt = select(func.coalesce(func.max(Story.order), 0)).where(
            Story.chapter_id == data.chapter_id
        )
        max_order = await db.scalar(count_stmt)
        order = int(max_order or 0) + 1
    
    story = Story(
        memoir_id=data.memoir_id,
        chapter_id=data.chapter_id,
        title=data.title,
        content=data.content,
        happened_at=data.happened_at,
        location=data.location,
        keywords=data.keywords,
        order=order,
        source=data.source,
        recording_id=data.recording_id,
        is_ai_processed=False
    )
    db.add(story)
    await db.flush()
    return story


async def update_story(db: AsyncSession, story_id: int, user_id: int, data: StoryUpdate) -> Story:
    story = await _ensure_story_owner(db, story_id, user_id)
    
    if data.title is not None:
        story.title = data.title
    if data.content is not None:
        story.content = data.content
    if data.happened_at is not None:
        story.happened_at = data.happened_at
    if data.location is not None:
        story.location = data.location
    if data.keywords is not None:
        story.keywords = data.keywords
    if data.recording_id is not None:
        story.recording_id = data.recording_id
        
    # 处理章节移动或排序变更
    if data.chapter_id is not None and data.chapter_id != story.chapter_id:
        story.chapter_id = data.chapter_id
        # 重新添加到新章节末尾
        count_stmt = select(func.coalesce(func.max(Story.order), 0)).where(
            Story.chapter_id == data.chapter_id
        )
        max_order = await db.scalar(count_stmt)
        story.order = int(max_order or 0) + 1
        
    if data.order is not None:
        story.order = data.order
        
    await db.flush()
    return story


async def delete_story(db: AsyncSession, story_id: int, user_id: int) -> None:
    story = await _ensure_story_owner(db, story_id, user_id)
    await db.delete(story)


def serialize_story(story: Story) -> dict:
    from app.schemas.story import StoryResponse
    return StoryResponse(
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
    ).model_dump(by_alias=True)
