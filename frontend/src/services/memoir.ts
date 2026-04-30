/**
 * 回忆录相关 API
 */

import { get, post, update, remove } from './request';
import type {
  CreateMemoirRequest,
  UpdateMemoirRequest,
  MemoirListResponse,
  MemoirDetailResponse,
} from '@/types/api';
import type { Memoir } from '@/types/models';

// ============================================
// 回忆录接口
// ============================================

/**
 * 获取回忆录列表
 */
export const getMemoirList = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<MemoirListResponse> => {
  return get<MemoirListResponse>('/api/v1/memoir/list', params);
};

/**
 * 获取公开的回忆录列表（广场）
 */
export const getPublicMemoirs = async (params?: {
  page?: number;
  pageSize?: number;
}): Promise<MemoirListResponse> => {
  return get<MemoirListResponse>('/api/v1/memoir/public', params);
};

/**
 * 获取回忆录详情
 */
export const getMemoirDetail = async (id: string): Promise<MemoirDetailResponse> => {
  return get<MemoirDetailResponse>(`/api/v1/memoir/detail?id=${id}`);
};

/**
 * 获取公开回忆录详情（广场）
 */
export const getPublicMemoirDetail = async (id: string): Promise<MemoirDetailResponse> => {
  return get<MemoirDetailResponse>(`/api/v1/memoir/public/detail?id=${id}`);
};

/**
 * 创建回忆录
 */
export const createMemoir = async (data: CreateMemoirRequest): Promise<Memoir> => {
  return post<Memoir>('/api/v1/memoir/create', data);
};

/**
 * 更新回忆录
 */
export const updateMemoir = async (id: string, data: UpdateMemoirRequest): Promise<void> => {
  await update(`/api/v1/memoir/update?id=${id}`, data);
};

/**
 * 删除回忆录
 */
export const deleteMemoir = async (id: string): Promise<void> => {
  await remove(`/api/v1/memoir/delete?id=${id}`);
};

/**
 * 发布回忆录
 */
export const publishMemoir = async (id: string): Promise<void> => {
  await post(`/api/v1/memoir/publish?id=${id}`);
};

/**
 * 导出回忆录
 */
export const exportMemoir = async (id: string, format: 'pdf' | 'epub'): Promise<{ url: string }> => {
  return post<{ url: string }>(`/api/v1/memoir/export?id=${id}`, { format });
};

// ============================================
// 章节接口（重新导出）
// ============================================

export {
  getChapterList,
  getChapterDetail,
  createChapter,
  updateChapter,
  deleteChapter,
  generateChapter,
} from './chapter';
