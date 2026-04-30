"""环境配置管理"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务器配置
    port: int = 8999
    node_env: str = "development"
    
    # 数据库
    database_url: str = "postgresql://postgres:password@localhost:5432/memoria"
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    
    # MinIO
    minio_endpoint: str = "localhost"
    minio_port: int = 9000
    minio_use_ssl: bool = False
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket_private: str = "memoir-private"
    minio_bucket_temp: str = "memoir-temp"
    
    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_access_expires_in: int = 7200  # 2小时
    jwt_refresh_expires_in: int = 604800  # 7天
    
    # 微信
    wechat_appid: str = ""
    wechat_secret: str = ""
    
    # ASR 语音识别
    asr_provider: str = "vllm"  # vllm | dashscope
    # vLLM 自部署
    asr_vllm_url: str = "http://localhost:8000"  # vLLM 服务地址
    asr_vllm_model: str = "Qwen/Qwen3-ASR-1.7B"  # vLLM 加载的模型名
    # DashScope 云端
    dashscope_api_key: str = ""
    asr_dashscope_model: str = "qwen3-asr-flash-realtime"
    # TODO: 后续添加 TTS 配置
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# 全局配置实例
settings = Settings()
