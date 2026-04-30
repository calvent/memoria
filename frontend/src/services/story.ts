/**
 * 故事相关 API
 */

import { get, post } from './request';

// ============================================
// 类型定义
// ============================================

export interface Story {
    id: number;
    memoirId: number;
    chapterId?: number;
    title: string;
    content: string;
    happenedAt?: string;
    location?: string;
    keywords?: string;
    order: number;
    source: string;
    isAiProcessed: boolean;
    recordingId?: number;
    createdAt: string;
    updatedAt: string;
}

export interface StoryListResponse {
    items: Story[];
}

export interface CreateStoryParams {
    memoirId: number;
    chapterId?: number;
    title: string;
    content: string;
    happenedAt?: string;
    location?: string;
    keywords?: string;
    source?: string;
    recordingId?: number;
}

export interface UpdateStoryParams {
    id: number;
    chapterId?: number;
    title?: string;
    content?: string;
    happenedAt?: string;
    location?: string;
    keywords?: string;
    order?: number;
    recordingId?: number;
}

// ============================================
// API 接口
// ============================================

/**
 * 获取故事列表
 */
export const getStoryList = async (params: { memoirId: number; chapterId?: number; uncategorized?: boolean }): Promise<StoryListResponse> => {
    let url = `/api/v1/story/list?memoirId=${params.memoirId}`;
    if (params.chapterId) {
        url += `&chapterId=${params.chapterId}`;
    }
    if (params.uncategorized) {
        url += `&uncategorized=true`;
    }
    return get<StoryListResponse>(url);
};

/**
 * 创建故事
 */
export const createStory = async (data: CreateStoryParams): Promise<Story> => {
    return post<Story>('/api/v1/story/create', data);
};

/**
 * 更新故事
 */
export const updateStory = async (data: UpdateStoryParams): Promise<Story> => {
    return post<Story>('/api/v1/story/update', data);
};

/**
 * 删除故事
 */
export const deleteStory = async (id: number): Promise<void> => {
    return post('/api/v1/story/delete', { id });
};
