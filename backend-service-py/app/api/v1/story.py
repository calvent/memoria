"""故事路由"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models import User
from app.schemas.story import StoryCreate, StoryUpdate, StoryResponse
from app.services import story as story_service
from app.utils.response import success_response
from app.utils.http import handle_value_error


router = APIRouter()


@router.get("/list")
async def get_stories(
    memoir_id: int = Query(...),
    chapter_id: int | None = Query(None),
    uncategorized: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取故事列表
    
    - 如果提供 chapter_id，返回该章节下已排序的故事
    - 如果 uncategorized=True，返回该回忆录下未分类的故事
    """
    if chapter_id:
        stories = await handle_value_error(
            lambda: story_service.get_stories_by_chapter(db, chapter_id, user.id),
            status_code=404
        )
    elif uncategorized:
        stories = await handle_value_error(
            lambda: story_service.get_uncategorized_stories(db, memoir_id, user.id),
            status_code=404
        )
    else:
        # TODO: 未来可以支持获取全部故事，暂时返回空或错误
        return success_response({"items": []})
        
    data = [story_service.serialize_story(s) for s in stories]
    return success_response({"items": data})


@router.post("/create")
async def create_story(
    body: StoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建故事"""
    story = await handle_value_error(
        lambda: story_service.create_story(db, user.id, body),
        status_code=404
    )
    return success_response(story_service.serialize_story(story))


@router.post("/update")
async def update_story(
    body: StoryUpdate,
    id: int | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新故事"""
    story_id = id or body.id
    if not story_id:
        raise HTTPException(status_code=400, detail="缺少故事ID")

    story = await handle_value_error(
        lambda: story_service.update_story(db, story_id, user.id, body),
        status_code=404
    )
    return success_response(story_service.serialize_story(story))


@router.post("/delete")
async def delete_story(
    id: int | None = Query(default=None),
    body: dict | None = Body(default=None), # 兼容 body 传参
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除故事"""
    story_id = id
    if not story_id and body and "id" in body:
        story_id = body["id"]
        
    if not story_id:
        raise HTTPException(status_code=400, detail="缺少故事ID")

    await handle_value_error(
        lambda: story_service.delete_story(db, story_id, user.id),
        status_code=404
    )
    return success_response({"message": "删除成功"})
