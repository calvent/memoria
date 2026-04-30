/**
 * 回忆录状态管理
 *
 * 管理回忆录列表和当前选中的回忆录
 */

import { create } from 'zustand';
import type { Memoir, Chapter } from '@/types/models';

// ============================================
// 类型定义
// ============================================

interface MemoirState {
  // 状态
  memoirs: Memoir[];
  currentMemoir: Memoir | null;
  currentChapters: Chapter[];

  // 加载状态
  isLoading: boolean;
  error: string | null;

  // 操作 - 回忆录
  setMemoirs: (memoirs: Memoir[]) => void;
  setCurrentMemoir: (memoir: Memoir | null) => void;
  addMemoir: (memoir: Memoir) => void;
  updateMemoir: (id: string, updates: Partial<Memoir>) => void;
  removeMemoir: (id: string) => void;

  // 操作 - 章节
  setCurrentChapters: (chapters: Chapter[]) => void;
  addChapter: (chapter: Chapter) => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  removeChapter: (id: string) => void;

  // 加载状态
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 重置
  reset: () => void;
}

// ============================================
// Store 实现
// ============================================

const initialState = {
  memoirs: [],
  currentMemoir: null,
  currentChapters: [],
  isLoading: false,
  error: null,
};

export const useMemoirStore = create<MemoirState>((set, get) => ({
  // 初始状态
  ...initialState,

  // === 回忆录操作 ===

  // 设置回忆录列表
  setMemoirs: (memoirs) => {
    set({ memoirs });
  },

  // 设置当前回忆录
  setCurrentMemoir: (memoir) => {
    set({ currentMemoir: memoir });
  },

  // 添加回忆录
  addMemoir: (memoir) => {
    set((state) => ({
      memoirs: [memoir, ...state.memoirs],
    }));
  },

  // 更新回忆录
  updateMemoir: (id, updates) => {
    set((state) => ({
      memoirs: state.memoirs.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
      currentMemoir:
        state.currentMemoir?.id === id
          ? { ...state.currentMemoir, ...updates }
          : state.currentMemoir,
    }));
  },

  // 删除回忆录
  removeMemoir: (id) => {
    set((state) => ({
      memoirs: state.memoirs.filter((m) => m.id !== id),
      currentMemoir:
        state.currentMemoir?.id === id ? null : state.currentMemoir,
    }));
  },

  // === 章节操作 ===

  // 设置当前回忆录的章节列表
  setCurrentChapters: (chapters) => {
    set({ currentChapters: chapters });
  },

  // 添加章节
  addChapter: (chapter) => {
    set((state) => ({
      currentChapters: [...state.currentChapters, chapter],
    }));
  },

  // 更新章节
  updateChapter: (id, updates) => {
    set((state) => ({
      currentChapters: state.currentChapters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  // 删除章节
  removeChapter: (id) => {
    set((state) => ({
      currentChapters: state.currentChapters.filter((c) => c.id !== id),
    }));
  },

  // === 加载状态 ===

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  // === 重置 ===
  reset: () => {
    set(initialState);
  },
}));

// ============================================
// 选择器
// ============================================

export const selectMemoirs = (state: MemoirState) => state.memoirs;
export const selectCurrentMemoir = (state: MemoirState) => state.currentMemoir;
export const selectCurrentChapters = (state: MemoirState) => state.currentChapters;
export const selectIsLoading = (state: MemoirState) => state.isLoading;
export const selectError = (state: MemoirState) => state.error;
