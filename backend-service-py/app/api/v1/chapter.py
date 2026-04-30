"""章节路由"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models import User
from app.schemas.chapter import ChapterCreate, ChapterUpdate, ChapterGenerate, ChapterDelete
from app.services import chapter as chapter_service
from app.utils.response import success_response
from app.utils.http import handle_value_error


router = APIRouter()


@router.get("/list")
async def get_chapter_list(
    memoir_id: int = Query(..., alias="memoirId"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取章节列表"""
    chapters = await handle_value_error(
        lambda: chapter_service.get_chapter_list(db, memoir_id, user.id),
        status_code=404,
    )
    data = [chapter_service.serialize_chapter(ch) for ch in chapters]
    return success_response({"items": data})


@router.get("/public/list")
async def get_public_chapter_list(
    memoir_id: int = Query(..., alias="memoirId"),
    db: AsyncSession = Depends(get_db)
):
    """获取公开回忆录的章节列表"""
    from app.models import Memoir, Chapter
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    # 先检查回忆录是否存在且已发布
    memoir = await db.get(Memoir, memoir_id)
    if not memoir or memoir.status != "completed":
        raise HTTPException(status_code=404, detail="回忆录不存在或未公开")
    
    # 获取章节列表，同时预加载 stories
    query = select(Chapter).options(
        selectinload(Chapter.stories)
    ).where(Chapter.memoir_id == memoir_id).order_by(Chapter.order)
    result = await db.execute(query)
    chapters = result.scalars().all()
    
    data = [chapter_service.serialize_chapter(ch) for ch in chapters]
    return success_response({"items": data})


@router.get("/detail")
async def get_chapter_detail(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取章节详情"""
    chapter = await handle_value_error(
        lambda: chapter_service.get_chapter_detail(db, id, user.id),
        status_code=404,
    )
    return success_response(chapter_service.serialize_chapter(chapter))


@router.get("/public/detail")
async def get_public_chapter_detail(
    id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """获取公开章节详情"""
    chapter = await handle_value_error(
        lambda: chapter_service.get_public_chapter_detail(db, id),
        status_code=404,
    )
    return success_response(chapter_service.serialize_chapter(chapter))


@router.post("/create")
async def create_chapter(
    body: ChapterCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建章节"""
    chapter = await handle_value_error(
        lambda: chapter_service.create_chapter(db, user.id, body),
        status_code=404,
    )
    return success_response(chapter_service.serialize_chapter(chapter))


@router.post("/update")
async def update_chapter(
    body: ChapterUpdate,
    id: int | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新章节"""
    chapter_id = id or body.id
    if not chapter_id:
        raise HTTPException(status_code=400, detail="缺少章节ID")

    chapter = await handle_value_error(
        lambda: chapter_service.update_chapter(db, chapter_id, user.id, body),
        status_code=404,
    )
    return success_response(chapter_service.serialize_chapter(chapter))


@router.post("/delete")
async def delete_chapter(
    id: int | None = Query(default=None),
    body: ChapterDelete | None = Body(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除章节"""
    chapter_id = id or (body.id if body else None)
    if not chapter_id:
        raise HTTPException(status_code=400, detail="缺少章节ID")

    await handle_value_error(
        lambda: chapter_service.delete_chapter(db, chapter_id, user.id),
        status_code=404,
    )
    return success_response({"message": "删除成功"})


@router.post("/generate")
async def generate_chapter(
    body: ChapterGenerate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI 生成章节"""
    chapter = await handle_value_error(
        lambda: chapter_service.generate_chapter(db, user.id, body),
        status_code=404,
    )
    return success_response(chapter_service.serialize_chapter(chapter))
