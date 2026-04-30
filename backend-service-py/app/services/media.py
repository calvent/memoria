"""媒体文件业务逻辑"""
from io import BytesIO
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.storage import minio_client
from app.config import settings
from app.models import MediaFile


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "audio/mpeg",
    "audio/wav",
    "audio/mp3",
    "audio/aac",
    "audio/m4a",
    "video/mp4",
    "video/mpeg",
}


def _get_media_type(mime_type: str) -> str:
    if mime_type.startswith("image/"):
        return "image"
    if mime_type.startswith("audio/"):
        return "audio"
    return "video"


def _get_object_key(media_type: str, user_id: int, file_id: str, ext: str) -> str:
    return f"{media_type}s/{user_id}/{file_id}.{ext}"


async def create_media(
    db: AsyncSession,
    user_id: int,
    filename: str,
    content_type: str,
    content: bytes,
):
    """创建媒体文件记录并上传"""
    if content_type not in ALLOWED_TYPES:
        raise ValueError("不支持的文件类型")

    max_size = 100 * 1024 * 1024
    if len(content) > max_size:
        raise ValueError("文件过大，最大支持 100MB")

    media_type = _get_media_type(content_type)
    ext = filename.split(".")[-1] if "." in filename else "bin"
    from nanoid import generate
    file_id = generate()

    object_key = _get_object_key(media_type, user_id, file_id, ext)

    minio_client.client.put_object(
        settings.minio_bucket_private,
        object_key,
        BytesIO(content),
        length=len(content),
        content_type=content_type,
    )

    s3_url = f"s3://{settings.minio_bucket_private}/{object_key}"
    media = MediaFile(
        user_id=user_id,
        type=media_type,
        url=s3_url,
        filename=filename,
        size=len(content),
        mime_type=content_type,
    )
    db.add(media)
    await db.flush()

    return media


async def get_media_by_id(db: AsyncSession, media_id: int) -> MediaFile | None:
    """获取媒体记录"""
    stmt = select(MediaFile).where(MediaFile.id == media_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def delete_media(db: AsyncSession, media_id: int, user_id: int) -> MediaFile:
    """删除媒体记录"""
    stmt = select(MediaFile).where(
        and_(MediaFile.id == media_id, MediaFile.user_id == user_id)
    )
    result = await db.execute(stmt)
    media = result.scalar_one_or_none()

    if not media:
        raise ValueError("媒体文件不存在")

    await db.delete(media)
    return media
