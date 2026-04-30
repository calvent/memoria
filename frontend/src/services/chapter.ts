/**
 * 章节相关 API
 */

import { get, post } from './request';
import { Story } from './story';

// ============================================
// 类型定义
// ============================================

export interface Chapter {
    id: number;
    memoirId: number;
    title: string;

    // 新字段
    description?: string;
    timePeriod?: string;
    introduction?: string;
    stories?: Story[];

    // 旧字段（用于向后兼容）
    content?: string;

    order: number;
    type?: string;
    isAiGenerated: boolean;
    status?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChapterListResponse {
    items: Chapter[];
}

// ============================================
// API 接口
// ============================================

/**
 * 获取章节列表
 */
export const getChapterList = async (memoirId: string): Promise<ChapterListResponse> => {
    return get<ChapterListResponse>(`/api/v1/chapter/list?memoirId=${memoirId}`);
};

/**
 * 获取公开回忆录的章节列表
 */
export const getPublicChapterList = async (memoirId: string): Promise<ChapterListResponse> => {
    return get<ChapterListResponse>(`/api/v1/chapter/public/list?memoirId=${memoirId}`);
};

/**
 * 获取章节详情
 */
export const getChapterDetail = (id: string | number) => {
    return get<Chapter>(`/api/v1/chapter/detail?id=${id}`);
};

/**
 * 获取公开章节详情
 */
export const getPublicChapterDetail = (id: string | number) => {
    return get<Chapter>(`/api/v1/chapter/public/detail?id=${id}`);
};

/**
 * 创建章节
 */
export const createChapter = (data: {
    memoirId: number;
    title: string;
    description?: string;
    timePeriod?: string;
    introduction?: string;
    type?: string;
}) => {
    return post<Chapter>('/api/v1/chapter/create', data);
};

/**
 * 更新章节
 */
export const updateChapter = (data: {
    id: number;
    title?: string;
    description?: string;
    timePeriod?: string;
    introduction?: string;
    type?: string;
}) => {
    return post<Chapter>('/api/v1/chapter/update', data);
};

/**
 * 删除章节
 */
export const deleteChapter = (id: string | number) => {
    return post('/api/v1/chapter/delete', { id });
};

/**
 * AI 生成章节
 */
export const generateChapter = (data: {
    memoirId: number;
    type: string;
    storyIds?: number[];  // 基于哪些故事生成章节
}) => {
    return post<Chapter>('/api/v1/chapter/generate', data);
};
