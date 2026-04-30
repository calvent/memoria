/**
 * API 接口类型定义
 */

import { Memoir, Chapter, Recording, ElderProfile, MediaFile, AITask } from './models';

// ============================================
// 通用类型
// ============================================

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface ApiError {
  code: number;
  message: string;
  error?: {
    field?: string;
    reason?: string;
  };
  timestamp: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// 认证相关 API
// ============================================

export interface WechatLoginRequest {
  code: string;
}

export interface WechatLoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    role: 'user' | 'admin';
  };
}

export interface RefreshTokenResponse {
  token: string;
}

// ============================================
// 用户相关 API
// ============================================

export interface UpdateProfileRequest {
  phone?: string;
}

// ============================================
// 老人档案相关 API
// ============================================

export interface CreateElderRequest {
  name: string;
  birthYear?: number;
  birthMonth?: number;
  gender?: 'male' | 'female';
  hometown?: string;
  dialect?: string;
  healthStatus?: string;
}

export interface UpdateElderRequest extends Partial<CreateElderRequest> { }

export interface ElderListResponse extends PaginationResponse<ElderProfile> { }

// ============================================
// 回忆录相关 API
// ============================================

export interface CreateMemoirRequest {
  title: string;
  elderId: string;
  coverImage?: string;
  description?: string;
}

export interface UpdateMemoirRequest extends Partial<CreateMemoirRequest> { }

export interface MemoirListResponse extends PaginationResponse<Memoir> { }

export interface MemoirDetailResponse extends Memoir {
  chapters?: Chapter[];
}

// ============================================
// 章节相关 API
// ============================================

export interface CreateChapterRequest {
  memoirId: string;
  title: string;
  type: string;
}

export interface UpdateChapterRequest {
  title?: string;
  content?: string;
}

export interface GenerateChapterContentRequest {
  chapterId: string;
  recordingIds: string[];
  theme?: string;
}

export interface ChapterListResponse {
  items: Chapter[];
}

// ============================================
// 录音相关 API
// ============================================

export interface UploadRecordingRequest {
  memoirId: string;
  chapterId?: string;
  audioFile: File;
  dialect?: string;
}

export interface UpdateTranscriptionRequest {
  recordingId: string;
  text: string;
}

// ============================================
// 媒体资源相关 API
// ============================================

export interface UploadMediaRequest {
  file: File;
  type: 'image' | 'audio' | 'video';
}

export interface EnhanceImageRequest {
  mediaId: string;
}

// ============================================
// AI 服务相关 API
// ============================================

export interface SpeechTranscribeRequest {
  audioUrl: string;
  dialect?: string;
}

export interface TextGenerateRequest {
  chapterId: string;
  transcriptionTexts: string[];
  theme?: string;
}

export interface TextPolishRequest {
  text: string;
  style?: 'narrative' | 'conversational' | 'formal';
}

export interface GenerateQuestionsRequest {
  topic: string;
  count?: number;
}

export interface TaskStatusResponse {
  taskId: string;
  status: string;
  progress?: number;
  result?: any;
}
