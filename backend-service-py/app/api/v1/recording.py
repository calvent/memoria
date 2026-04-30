"""录音路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models import User
from app.schemas.recording import RecordingCreate, RecordingUpdateTranscription, RecordingResponse
from app.services import recording as recording_service
from app.utils.response import success_response
from app.utils.http import handle_value_error
from app.core.storage import minio_client
from app.config import settings


router = APIRouter()


@router.post("/create")
async def create_recording(
    body: RecordingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """创建录音记录"""
    recording = await handle_value_error(
        lambda: recording_service.create_recording(db, user.id, body),
        status_code=400,
    )
    data = RecordingResponse.model_validate(recording).model_dump(by_alias=True)
    data["audioUrl"] = f"/api/v1/recording/audio/{recording.id}"
    return success_response(data)


@router.get("/detail")
async def get_recording_detail(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取录音详情"""
    recording = await handle_value_error(
        lambda: recording_service.get_recording_detail(db, id, user.id),
        status_code=404,
    )
    data = RecordingResponse.model_validate(recording).model_dump(by_alias=True)
    data["audioUrl"] = f"/api/v1/recording/audio/{recording.id}"
    return success_response(data)


@router.get("/audio/{id}")
async def get_recording_audio(
    id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """获取录音音频（代理访问）"""
    recording = await handle_value_error(
        lambda: recording_service.get_recording_detail(db, id, user.id),
        status_code=404,
    )
    s3_url = recording.audio_url
    if not s3_url.startswith("s3://"):
        raise HTTPException(status_code=400, detail="无效的音频路径")

    object_key = s3_url.replace(f"s3://{settings.minio_bucket_private}/", "")
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
        "Content-Disposition": f"inline; filename=\"recording-{id}.wav\"",
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
    }
    return StreamingResponse(iter_file(), media_type="audio/wav", headers=headers)


@router.post("/update_transcription")
async def update_transcription(
    body: RecordingUpdateTranscription,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """更新转写文本"""
    await handle_value_error(
        lambda: recording_service.update_transcription(
            db, body.recording_id, user.id, body.text
        ),
        status_code=404,
    )
    return success_response({"message": "更新成功"})


@router.post("/delete")
async def delete_recording(
    id: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """删除录音"""
    await handle_value_error(
        lambda: recording_service.delete_recording(db, id, user.id),
        status_code=404,
    )
    return success_response({"message": "删除成功"})
