"""数据库模型定义"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    wechat_openid: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    elder_profiles: Mapped[list["ElderProfile"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    memoirs: Mapped[list["Memoir"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    recordings: Mapped[list["Recording"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    media_files: Mapped[list["MediaFile"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class ElderProfile(Base):
    """老人档案表"""
    __tablename__ = "elder_profiles"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(50))
    nickname: Mapped[Optional[str]] = mapped_column(String(50))
    birth_year: Mapped[Optional[int]] = mapped_column(Integer)
    birth_month: Mapped[Optional[int]] = mapped_column(Integer)
    gender: Mapped[Optional[str]] = mapped_column(String(10))
    hometown: Mapped[Optional[str]] = mapped_column(String(100))
    dialect: Mapped[Optional[str]] = mapped_column(String(50))
    health_status: Mapped[Optional[str]] = mapped_column(Text)
    avatar: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user: Mapped["User"] = relationship(back_populates="elder_profiles")
    memoirs: Mapped[list["Memoir"]] = relationship(back_populates="elder")


class Memoir(Base):
    """回忆录表"""
    __tablename__ = "memoirs"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    elder_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("elder_profiles.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(200))
    cover_image: Mapped[Optional[str]] = mapped_column(Text)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user: Mapped["User"] = relationship(back_populates="memoirs")
    elder: Mapped[Optional["ElderProfile"]] = relationship(back_populates="memoirs")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="memoir", cascade="all, delete-orphan")
    stories: Mapped[list["Story"]] = relationship(back_populates="memoir", cascade="all, delete-orphan")
    recordings: Mapped[list["Recording"]] = relationship(back_populates="memoir")


class Chapter(Base):
    """章节表 - 故事的容器"""
    __tablename__ = "chapters"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    memoir_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memoirs.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text)  # 章节概述
    time_period: Mapped[Optional[str]] = mapped_column(String(100))  # 时间段，如"1970-1975"
    introduction: Mapped[Optional[str]] = mapped_column(Text)  # AI生成的章节开头语
    order: Mapped[int] = mapped_column(Integer)
    type: Mapped[Optional[str]] = mapped_column(String(50))
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    memoir: Mapped["Memoir"] = relationship(back_populates="chapters")
    stories: Mapped[list["Story"]] = relationship(back_populates="chapter", cascade="all, delete-orphan")
    recordings: Mapped[list["Recording"]] = relationship(back_populates="chapter")


class Story(Base):
    """故事表 - 回忆录的原子内容单元"""
    __tablename__ = "stories"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    memoir_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("memoirs.id", ondelete="CASCADE"))
    chapter_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("chapters.id", ondelete="SET NULL"))
    
    title: Mapped[str] = mapped_column(String(200))  # 故事标题，如"进厂第一天"
    content: Mapped[str] = mapped_column(Text)  # 故事正文
    happened_at: Mapped[Optional[str]] = mapped_column(String(100))  # 发生时间，如"1970年8月"
    location: Mapped[Optional[str]] = mapped_column(String(200))  # 发生地点
    keywords: Mapped[Optional[str]] = mapped_column(Text)  # 关键词（JSON数组）
    
    order: Mapped[int] = mapped_column(Integer, default=0)  # 在章节内的排序
    source: Mapped[str] = mapped_column(String(20), default="manual")  # 'recording'/'manual'/'ai'
    is_ai_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    recording_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("recordings.id", ondelete="SET NULL"))
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    memoir: Mapped["Memoir"] = relationship(back_populates="stories")
    chapter: Mapped[Optional["Chapter"]] = relationship(back_populates="stories")
    recording: Mapped[Optional["Recording"]] = relationship(back_populates="story")


class Recording(Base):
    """录音表"""
    __tablename__ = "recordings"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    memoir_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("memoirs.id", ondelete="SET NULL"))
    chapter_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("chapters.id", ondelete="SET NULL"))
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    audio_url: Mapped[str] = mapped_column(Text)
    duration: Mapped[Optional[int]] = mapped_column(Integer)
    dialect: Mapped[Optional[str]] = mapped_column(String(50))
    transcription_text: Mapped[Optional[str]] = mapped_column(Text)
    transcription_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    user: Mapped["User"] = relationship(back_populates="recordings")
    memoir: Mapped[Optional["Memoir"]] = relationship(back_populates="recordings")
    chapter: Mapped[Optional["Chapter"]] = relationship(back_populates="recordings")
    story: Mapped[Optional["Story"]] = relationship(back_populates="recording")


class MediaFile(Base):
    """媒体文件表"""
    __tablename__ = "media_files"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(20))
    url: Mapped[str] = mapped_column(Text)
    filename: Mapped[Optional[str]] = mapped_column(String(255))
    size: Mapped[Optional[int]] = mapped_column(Integer)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))
    related_type: Mapped[Optional[str]] = mapped_column(String(50))
    related_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    # 关系
    user: Mapped["User"] = relationship(back_populates="media_files")


class AITask(Base):
    """AI 任务表"""
    __tablename__ = "ai_tasks"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    params: Mapped[str] = mapped_column(Text)
    result: Mapped[Optional[str]] = mapped_column(Text)
    error: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    worker_id: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    started_at: Mapped[Optional[datetime]]
    completed_at: Mapped[Optional[datetime]]


class Notification(Base):
    """通知表"""
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[Optional[str]] = mapped_column(Text)
    is_read: Mapped[str] = mapped_column(String(10), default="false")
    related_type: Mapped[Optional[str]] = mapped_column(String(50))
    related_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class AuditLog(Base):
    """审计日志表"""
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(100))
    resource: Mapped[Optional[str]] = mapped_column(String(100))
    resource_id: Mapped[Optional[int]] = mapped_column(BigInteger)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
