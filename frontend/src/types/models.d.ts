/**
 * 数据模型类型定义
 */

// ============================================
// 用户相关类型
// ============================================

export interface User {
  id: string;
  phone?: string;
  wechatOpenid: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface ElderProfile {
  id: string;
  userId: string;
  name: string;
  nickname?: string;  // 昵称/笔名，优先显示
  birthYear?: number;
  birthMonth?: number;
  gender?: 'male' | 'female';
  hometown?: string;
  dialect?: string;
  healthStatus?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 回忆录相关类型
// ============================================

export type MemoirStatus = 'draft' | 'generating' | 'completed';

export interface Memoir {
  id: string;
  userId: string;
  elderId: string;
  title: string;
  coverImage?: string;
  status: MemoirStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 章节相关类型
// ============================================

export type ChapterType = 'introduction' | 'childhood' | 'youth' | 'adulthood' | 'family' | 'career' | 'other';

export interface Chapter {
  id: string;
  memoirId: string;
  title: string;
  content: string;
  type: ChapterType;
  order: number;
  recordingIds: string[];
  mediaIds: string[];
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 录音相关类型
// ============================================

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Recording {
  id: string;
  memoirId: string;
  chapterId?: string;
  audioUrl: string;
  duration: number;
  dialect?: string;
  transcriptionText?: string;
  transcriptionStatus: TranscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 媒体资源类型
// ============================================

export type MediaType = 'image' | 'audio' | 'video';

export interface MediaFile {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  mimeType: string;
  uploadedAt: string;
}

// ============================================
// AI 任务类型
// ============================================

export type TaskType = 'asr' | 'text_generation' | 'image_enhancement' | 'export';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead';

export interface AITask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ============================================
// 广场/社区相关类型
// ============================================

export interface PlazaUser {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface PlazaMemoir extends Memoir {
  author: PlazaUser;
  chapterCount: number;
  memoryCount: number;
  isPublic: boolean;
}

