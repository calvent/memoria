/**
 * 认证相关 API
 */

import { post } from './request';
import type { WechatLoginRequest, WechatLoginResponse } from '@/types/api';

// ============================================
// 接口实现
// ============================================

/**
 * 微信登录
 */
export const wechatLogin = async (code: string): Promise<WechatLoginResponse> => {
  const data = await post<WechatLoginResponse>('/api/v1/auth/wechat_login', {
    code,
  });
  return data;
};

/**
 * 登出
 */
export const logout = async (): Promise<void> => {
  await post('/api/v1/auth/logout');
};

/**
 * 刷新 Token
 */
export const refreshToken = async (): Promise<{ token: string }> => {
  const data = await post<{ token: string }>('/api/v1/auth/refresh_token');
  return data;
};
