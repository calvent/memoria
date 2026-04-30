"""媒体文件路由"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models import User
from app.services import media as media_service
from app.utils.response import success_response
from app.utils.http import handle_value_error
from app.core.storage import minio_client
from app.config import settings


router = APIRouter()


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """上传媒体文件"""
    content = await file.read()
    media = await handle_value_error(
        lambda: media_service.create_media(
            db=db,
            user_id=user.id,
            filename=file.filename or "file",
            content_type=file.content_type or "application/octet-stream",
            content=content,
        ),
        status_code=400,
    )

    proxy_url = f"/api/v1/media/file/{media.id}"
    return success_response({
        "id": media.id,
        "url": proxy_url,
        "type": media.type,
        "size": media.size,
        "filename": media.filename,
    })


@router.get("/file/{id}")
async def get_media_file(
    id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取媒体文件（代理访问）"""
    try:
        media = await media_service.get_media_by_id(db, id)
        if not media:
            raise HTTPException(status_code=404, detail="媒体文件不存在")
        if media.user_id != user.id:
            raise HTTPException(status_code=403, detail="无权访问此文件")

        if not media.url.startswith("s3://"):
            raise ValueError("无效的文件路径")

        object_key = media.url.replace(f"s3://{settings.minio_bucket_private}/", "")
        obj = minio_client.client.get_object(settings.minio_bucket_private, object_key)

        def iter_file():
            try:
                while True:
                    data = obj.read(32 * 1024)
                    if not data:
                        break
                    yield data
            finally:
                obj.close()
                obj.release_conn()

        headers = {
            "Content-Disposition": f"inline; filename=\"{media.filename or 'file'}\"",
            "Cache-Control": "public, max-age=3600",
        }
        return StreamingResponse(iter_file(), media_type=media.mime_type or "application/octet-stream", headers=headers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/delete")
async def delete_media(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除媒体文件"""
    media = await handle_value_error(
        lambda: media_service.delete_media(db, id, user.id),
        status_code=404,
    )

    if media.url.startswith("s3://"):
        object_key = media.url.replace(f"s3://{settings.minio_bucket_private}/", "")
        try:
            minio_client.client.remove_object(settings.minio_bucket_private, object_key)
        except Exception:
            pass

    return success_response({"message": "删除成功"})
