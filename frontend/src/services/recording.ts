/**
 * 录音相关 API
 */

import { get, post, remove, uploadFile } from './request';
import type { Recording } from '@/types/models';

// ============================================
// 接口实现
// ============================================

/**
 * 上传录音文件
 */
export const uploadRecording = async (params: {
  memoirId: string;
  chapterId?: string;
  filePath: string;
  dialect?: string;
}): Promise<Recording> => {
  const { memoirId, chapterId, filePath, dialect } = params;

  // 先上传文件获取 URL
  const uploadResult = await uploadFile('/api/v1/media/upload', filePath, 'file');

  // 创建录音记录
  return post<Recording>('/api/v1/recording/create', {
    memoirId,
    chapterId,
    audioUrl: uploadResult.url,
    dialect,
  });
};

/**
 * 获取录音详情
 */
export const getRecordingDetail = async (id: string): Promise<Recording> => {
  return get<Recording>(`/api/v1/recording/detail?id=${id}`);
};

/**
 * 更新转写文本
 */
export const updateTranscription = async (
  recordingId: string,
  text: string
): Promise<void> => {
  await post('/api/v1/recording/update_transcription', {
    recordingId,
    text,
  });
};

/**
 * 删除录音
 */
export const deleteRecording = async (id: string): Promise<void> => {
  await remove(`/api/v1/recording/delete?id=${id}`);
};
