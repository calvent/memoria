/**
 * 认证状态管理
 *
 * 管理用户登录、登出和用户信息
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import type { User } from '@/types/models';

// ============================================
// 类型定义
// ============================================

interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // 操作
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// ============================================
// Store 实现
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // 设置用户
      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      // 设置 Token
      setToken: (token) => {
        // 同步到 Taro 存储
        Taro.setStorageSync('token', token);
        set({ token });
      },

      // 设置 Refresh Token
      setRefreshToken: (refreshToken) => {
        // 同步到 Taro 存储
        Taro.setStorageSync('refreshToken', refreshToken);
        set({ refreshToken });
      },

      // 同时设置 Token 和 Refresh Token（登录时使用）
      setTokens: (token, refreshToken) => {
        // 同步到 Taro 存储
        Taro.setStorageSync('token', token);
        Taro.setStorageSync('refreshToken', refreshToken);
        set({ token, refreshToken, isAuthenticated: true });
      },

      // 登出
      logout: () => {
        // 清除 Taro 存储
        Taro.removeStorageSync('token');
        Taro.removeStorageSync('refreshToken');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // 更新用户信息
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      // 使用 Taro 存储适配器
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          return Taro.getStorageSync(name) || null;
        },
        setItem: (name, value) => {
          Taro.setStorageSync(name, value);
        },
        removeItem: (name) => {
          Taro.removeStorageSync(name);
        },
      })),
      // 避免在 App 初始化前触发存储读取
      skipHydration: true,
    }
  )
);

// ============================================
// 选择器（用于优化性能）
// ============================================

export const selectUser = (state: AuthState) => state.user;
export const selectToken = (state: AuthState) => state.token;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
