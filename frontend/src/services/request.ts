/**
 * HTTP 请求封装
 *
 * 基于 Taro.request 的封装，统一处理认证、错误、拦截器等
 */

import Taro from '@tarojs/taro';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse, ApiError, WechatLoginResponse } from '@/types/api';
import { API_BASE_URL, IS_DEV } from '@/config/env';

// ============================================
// 配置
// ============================================

const BASE_URL = API_BASE_URL;

// ============================================
// 类型定义
// ============================================

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取 Token
 */
const getToken = (): string | null => {
  return useAuthStore.getState().token || Taro.getStorageSync('token');
};

/**
 * 获取 Refresh Token
 */
const getRefreshToken = (): string | null => {
  return (
    useAuthStore.getState().refreshToken || Taro.getStorageSync('refreshToken')
  );
};

/**
 * 使用 code 登录
 */
const loginWithCode = async (code: string): Promise<WechatLoginResponse> => {
  const response = await Taro.request({
    url: `${BASE_URL}/api/v1/auth/wechat_login`,
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
    },
    data: { code },
  });

  if (response.statusCode === 200 && response.data) {
    const apiData = response.data as ApiResponse<WechatLoginResponse>;
    if (apiData.code === 0 && apiData.data) {
      return apiData.data;
    }
    throw new Error(apiData.message || '登录失败');
  }

  throw new Error('登录失败');
};

/**
 * 自动登录（用于开发环境或小程序环境）
 */
const autoLogin = async (): Promise<WechatLoginResponse | null> => {
  // 开发环境：使用手机号登录（访问我们seed的测试数据）
  if (IS_DEV) {
    console.log('[Auth] 开发环境，使用手机号登录');
    try {
      // 使用张天明的账号进行开发测试
      const response = await Taro.request({
        url: `${BASE_URL}/api/v1/auth/phone_login`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
        },
        data: { phone: '13800138001' }, // 张天明的手机号
      });

      if (response.statusCode === 200 && response.data) {
        const apiData = response.data as ApiResponse<WechatLoginResponse>;
        if (apiData.code === 0 && apiData.data) {
          return apiData.data;
        }
      }
    } catch (error) {
      console.error('[Auth] 手机号登录失败:', error);
      // 如果失败，回退到dev code
      return loginWithCode('dev');
    }
  }

  // 生产环境：微信小程序真实登录
  const env = Taro.getEnv();
  if (env === Taro.ENV_TYPE.WEAPP) {
    console.log('[Auth] 微信小程序环境，调用 wx.login');
    const loginResult = await Taro.login();
    if (!loginResult.code) {
      throw new Error('获取微信登录凭证失败');
    }
    return loginWithCode(loginResult.code);
  }

  return null;
};

/**
 * 刷新 Token
 */
const refreshToken = async (): Promise<string> => {
  try {
    // 获取 refresh token
    const storedRefreshToken = getRefreshToken();

    if (!storedRefreshToken) {
      throw new Error('缺少 refresh token');
    }

    const response = await Taro.request({
      url: `${BASE_URL}/api/v1/auth/refresh_token`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      data: {
        refreshToken: storedRefreshToken,
      },
    });

    // ✅ 正确处理 Taro.request 返回类型
    if (response.statusCode === 200 && response.data) {
      const apiData = response.data as ApiResponse<{ token: string }>;
      if (apiData.code === 0 && apiData.data) {
        return apiData.data.token;
      }
    }

    throw new Error('刷新 Token 失败');
  } catch (error) {
    console.error('[Auth] Token 刷新失败:', error);
    throw error;
  }
};

/**
 * 处理请求错误
 */
const handleError = async (
  error: any,
  skipErrorHandler = false
): Promise<void> => {
  if (skipErrorHandler) {
    return;
  }

  // 显示错误提示
  Taro.showToast({
    title: error.message || '请求失败',
    icon: 'none',
    duration: 2000,
  });
};

// ============================================
// 核心请求函数
// ============================================

/**
 * 通用请求函数
 */
const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    skipAuth = false,
    skipErrorHandler = false,
  } = options;
  let autoLoginAttempted = false;

  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...header,
  };

  // 添加 Token
  if (!skipAuth) {
    let token = getToken();

    if (!token && !url.startsWith('/api/v1/auth/')) {
      autoLoginAttempted = true;
      try {
        const loginData = await autoLogin();
        if (loginData) {
          useAuthStore.getState().setTokens(
            loginData.token,
            loginData.refreshToken
          );
          token = loginData.token;
        }
      } catch (loginError) {
        console.error('[Auth] 自动登录失败:', loginError);
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: headers,
    });

    // ✅ 正确处理 Taro 响应类型
    const { statusCode, data: responseData } = response;
    const apiData = responseData as ApiResponse<T>;

    // 成功响应
    if (statusCode === 200 && apiData.code === 0) {
      return apiData.data as T;
    }

    // 业务错误
    const error: any = new Error(apiData.message || '请求失败');
    error.data = apiData;
    throw error;
  } catch (error: any) {
    // Token 过期，尝试刷新
    if (error.statusCode === 401 || error.data?.code === 401) {
      const storedRefreshToken = getRefreshToken();

      if (storedRefreshToken) {
        try {
          const newToken = await refreshToken();
          useAuthStore.getState().setToken(newToken);
          Taro.setStorageSync('token', newToken);

          // 重试原请求
          return request({ ...options, skipAuth: false });
        } catch (refreshError) {
          // 刷新失败，清除认证状态
          console.error('[Auth] Token 刷新失败:', refreshError);
          useAuthStore.getState().logout();
          Taro.showToast({
            title: '登录已过期，请重启小程序',
            icon: 'none',
            duration: 8999,
          });
          throw refreshError;
        }
      }

      if (!autoLoginAttempted && !skipAuth && !url.startsWith('/api/v1/auth/')) {
        try {
          const loginData = await autoLogin();
          if (loginData) {
            useAuthStore.getState().setTokens(
              loginData.token,
              loginData.refreshToken
            );

            // 重试原请求
            return request({ ...options, skipAuth: false });
          }
        } catch (loginError) {
          console.error('[Auth] 自动登录失败:', loginError);
          useAuthStore.getState().logout();
          Taro.showToast({
            title: '自动登录失败，请检查网络',
            icon: 'none',
            duration: 8999,
          });
        }
      }

      // 清除认证状态
      useAuthStore.getState().logout();
      throw error;
    }

    // 其他错误
    await handleError(error, skipErrorHandler);
    throw error;
  }
};

// ============================================
// 导出的便捷方法
// ============================================

/**
 * GET 请求
 */
export const get = <T = any>(url: string, params?: any): Promise<T> => {
  const queryString = params
    ? '?' +
    Object.keys(params)
      .map((key) => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
    : '';

  return request<T>({
    url: url + queryString,
    method: 'GET',
  });
};

/**
 * POST 请求
 */
export const post = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
};

/**
 * 更新请求（使用 POST）
 * 用于替代 PUT 请求
 */
export const update = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
};

/**
 * 删除请求（使用 POST）
 * 用于替代 DELETE 请求
 */
export const remove = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
};

/**
 * 文件上传
 */
export const uploadFile = (
  url: string,
  filePath: string,
  name: string = 'file'
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const token = getToken();

    Taro.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name,
      header: token ? { Authorization: `Bearer ${token}` } : undefined,
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } catch (error) {
          reject(error);
        }
      },
      fail: reject,
    });
  });
};
