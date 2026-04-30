"""回忆录路由"""
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models import User
from app.schemas.memoir import MemoirCreate, MemoirUpdate, MemoirResponse
from app.services import memoir as memoir_service
from app.utils.response import success_response, paginated_response
from app.utils.http import handle_value_error


router = APIRouter()


@router.get("/list")
async def get_memoir_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    status: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取回忆录列表"""
    from app.models import ElderProfile,Chapter
    from sqlalchemy import select, func
    
    result = await memoir_service.get_memoir_list(
        db, user.id, page, page_size, status
    )
    
    # Enrich数据：添加elder_name和chapter_count
    enriched_items = []
    for memoir in result["items"]:
        memoir_dict = MemoirResponse.model_validate(memoir).model_dump(by_alias=True)
        
        # 获取elder name 和 nickname
        if memoir.elder_id:
            elder = await db.get(ElderProfile, memoir.elder_id)
            if elder:
                memoir_dict["elderName"] = elder.name
                memoir_dict["elderNickname"] = elder.nickname
        
        # 获取chapter count
        chapter_count_query = select(func.count()).where(Chapter.memoir_id == memoir.id)
        chapter_count = await db.scalar(chapter_count_query) or 0
        memoir_dict["chapterCount"] = chapter_count
        
        enriched_items.append(memoir_dict)
    
    return paginated_response(
        enriched_items,
        result["total"],
        page,
        page_size
    )


@router.get("/public")
async def get_public_memoirs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100, alias="pageSize"),
    db: AsyncSession = Depends(get_db)
):
    """获取公开的回忆录列表（广场）"""
    from app.models import ElderProfile, Chapter, Memoir
    from sqlalchemy import select, func, desc
    
    # 查询所有completed状态的回忆录
    query = select(Memoir).where(Memoir.status == "completed")
    
    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # 分页查询
    query = query.order_by(desc(Memoir.updated_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    memoirs = result.scalars().all()
    
    # Enrich数据：添加elder_name和chapter_count
    enriched_items = []
    for memoir in memoirs:
        memoir_dict = MemoirResponse.model_validate(memoir).model_dump(by_alias=True)
        
        # 获取elder name 和 nickname
        if memoir.elder_id:
            elder = await db.get(ElderProfile, memoir.elder_id)
            if elder:
                memoir_dict["elderName"] = elder.name
                memoir_dict["elderNickname"] = elder.nickname
        
        # 获取chapter count
        chapter_count_query = select(func.count()).where(Chapter.memoir_id == memoir.id)
        chapter_count = await db.scalar(chapter_count_query) or 0
        memoir_dict["chapterCount"] = chapter_count
        
        enriched_items.append(memoir_dict)
    
    return paginated_response(
        enriched_items,
        total or 0,
        page,
        page_size
    )


@router.get("/detail")
async def get_memoir_detail(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取回忆录详情"""
    from app.models import ElderProfile, Chapter
    from sqlalchemy import select, func

    memoir = await handle_value_error(
        lambda: memoir_service.get_memoir_detail(db, id, user.id),
        status_code=404,
    )

    memoir_dict = MemoirResponse.model_validate(memoir).model_dump(by_alias=True)

    # 获取elder name 和 nickname
    if memoir.elder_id:
        elder = await db.get(ElderProfile, memoir.elder_id)
        if elder:
            memoir_dict["elderName"] = elder.name
            memoir_dict["elderNickname"] = elder.nickname

    # 获取chapter count
    chapter_count_query = select(func.count()).where(Chapter.memoir_id == memoir.id)
    chapter_count = await db.scalar(chapter_count_query) or 0
    memoir_dict["chapterCount"] = chapter_count

    return success_response(memoir_dict)


@router.get("/public/detail")
async def get_public_memoir_detail(
    id: int = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """获取公开回忆录详情（广场）"""
    from app.models import Memoir, ElderProfile, Chapter
    from sqlalchemy import select, func
    
    memoir = await db.get(Memoir, id)
    
    if not memoir:
        raise HTTPException(status_code=404, detail="回忆录不存在")
    
    # 只允许查看已发布的回忆录
    if memoir.status != "completed":
        raise HTTPException(status_code=403, detail="该回忆录未公开")
    
    # Enrich数据
    memoir_dict = MemoirResponse.model_validate(memoir).model_dump(by_alias=True)
    
    # 获取elder name 和 nickname
    if memoir.elder_id:
        elder = await db.get(ElderProfile, memoir.elder_id)
        if elder:
            memoir_dict["elderName"] = elder.name
            memoir_dict["elderNickname"] = elder.nickname
    
    # 获取chapter count
    chapter_count_query = select(func.count()).where(Chapter.memoir_id == memoir.id)
    chapter_count = await db.scalar(chapter_count_query) or 0
    memoir_dict["chapterCount"] = chapter_count
    
    return success_response(memoir_dict)


@router.post("/create")
async def create_memoir(
    body: MemoirCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建回忆录"""
    memoir = await handle_value_error(
        lambda: memoir_service.create_memoir(db, user.id, body),
        status_code=400,
    )
    return success_response(MemoirResponse.model_validate(memoir).model_dump(by_alias=True))


@router.post("/update")
async def update_memoir(
    body: MemoirUpdate,
    id: int | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新回忆录"""
    memoir_id = id or body.id
    if not memoir_id:
        raise HTTPException(status_code=400, detail="缺少回忆录ID")

    await handle_value_error(
        lambda: memoir_service.update_memoir(db, memoir_id, user.id, body),
        status_code=404,
    )
    return success_response({"message": "更新成功"})


@router.post("/delete")
async def delete_memoir(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除回忆录"""
    await handle_value_error(
        lambda: memoir_service.delete_memoir(db, id, user.id),
        status_code=404,
    )
    return success_response({"message": "删除成功"})


@router.post("/publish")
async def publish_memoir(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """发布回忆录"""
    await handle_value_error(
        lambda: memoir_service.publish_memoir(db, id, user.id),
        status_code=404,
    )
    return success_response({"message": "发布成功"})


@router.post("/export")
async def export_memoir(
    id: int = Query(...),
    format: str = Body(..., embed=True)
):
    """导出回忆录（占位）"""
    raise HTTPException(status_code=400, detail="导出功能开发中")
