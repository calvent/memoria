"""MinIO 对象存储客户端"""
from minio import Minio
from minio.error import S3Error
from io import BytesIO
from app.config import settings


class MinioClient:
    """MinIO 客户端封装"""
    
    def __init__(self):
        self.client = Minio(
            f"{settings.minio_endpoint}:{settings.minio_port}",
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_use_ssl,
        )
        self.bucket_private = settings.minio_bucket_private
        self.bucket_temp = settings.minio_bucket_temp
    
    def init_buckets(self):
        """初始化存储桶"""
        for bucket in [self.bucket_private, self.bucket_temp]:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
                    print(f"✅ 创建 MinIO 存储桶: {bucket}")
                else:
                    print(f"✅ MinIO 存储桶已存在: {bucket}")
            except S3Error as e:
                print(f"❌ MinIO 存储桶初始化失败: {e}")
    
    def upload_file(self, bucket: str, object_name: str, data: bytes, content_type: str) -> str:
        """上传文件"""
        try:
            self.client.put_object(
                bucket,
                object_name,
                BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
            return f"/{bucket}/{object_name}"
        except S3Error as e:
            raise Exception(f"上传失败: {e}")
    
    def get_file_url(self, bucket: str, object_name: str, expires: int = 3600) -> str:
        """获取文件访问 URL"""
        try:
            return self.client.presigned_get_object(bucket, object_name, expires=expires)
        except S3Error as e:
            raise Exception(f"获取 URL 失败: {e}")
    
    def delete_file(self, bucket: str, object_name: str):
        """删除文件"""
        try:
            self.client.remove_object(bucket, object_name)
        except S3Error as e:
            raise Exception(f"删除失败: {e}")


# 全局 MinIO 客户端
minio_client = MinioClient()


def get_minio() -> MinioClient:
    """依赖注入：获取 MinIO 客户端"""
    return minio_client
