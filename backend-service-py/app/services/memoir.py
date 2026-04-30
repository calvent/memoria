"""回忆录业务逻辑"""
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Memoir
from app.schemas.memoir import MemoirCreate, MemoirUpdate


async def get_memoir_list(
    db: AsyncSession,
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    status: str | None = None,
) -> dict:
    """获取回忆录列表"""
    query = select(Memoir).where(Memoir.user_id == user_id)
    
    if status:
        query = query.where(Memoir.status == status)
    
    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)
    
    # 分页查询
    query = query.order_by(desc(Memoir.created_at)).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {
        "items": items,
        "total": total or 0,
    }


async def get_memoir_detail(db: AsyncSession, memoir_id: int, user_id: int) -> Memoir:
    """获取回忆录详情"""
    memoir = await db.get(Memoir, memoir_id)
    
    if not memoir or memoir.user_id != user_id:
        raise ValueError("回忆录不存在")
    
    return memoir


async def create_memoir(db: AsyncSession, user_id: int, data: MemoirCreate) -> Memoir:
    """创建回忆录"""
    memoir = Memoir(
        user_id=user_id,
        title=data.title,
        cover_image=data.cover_image,
        description=data.description,
        elder_id=data.elder_id,
        status="draft",
    )
    
    db.add(memoir)
    await db.flush()
    
    return memoir


async def update_memoir(db: AsyncSession, memoir_id: int, user_id: int, data: MemoirUpdate):
    """更新回忆录"""
    memoir = await get_memoir_detail(db, memoir_id, user_id)
    
    if data.title is not None:
        memoir.title = data.title
    if data.cover_image is not None:
        memoir.cover_image = data.cover_image
    if data.description is not None:
        memoir.description = data.description
    if data.elder_id is not None:
        memoir.elder_id = data.elder_id
    if data.status is not None:
        memoir.status = data.status
    
    await db.flush()


async def delete_memoir(db: AsyncSession, memoir_id: int, user_id: int):
    """删除回忆录"""
    memoir = await get_memoir_detail(db, memoir_id, user_id)
    await db.delete(memoir)


async def publish_memoir(db: AsyncSession, memoir_id: int, user_id: int):
    """发布回忆录"""
    memoir = await get_memoir_detail(db, memoir_id, user_id)
    memoir.status = "completed"
    await db.flush()
