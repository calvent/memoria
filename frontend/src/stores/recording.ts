/**
 * 录音状态管理
 *
 * 管理录音状态、实时转写和录音列表
 */

import { create } from 'zustand';
import type { Recording } from '@/types/models';

// ============================================
// 类型定义
// ============================================

interface RecordingState {
  // 录音状态
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;

  // 实时转写
  isTranscribing: boolean;
  currentTranscript: string;
  fullTranscript: string;

  // 录音列表
  recordings: Recording[];
  currentRecording: Recording | null;

  // WebSocket 连接状态
  wsConnected: boolean;
  wsError: string | null;

  // 操作 - 录音
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  setRecordingDuration: (duration: number) => void;

  // 操作 - 转写
  startTranscribing: () => void;
  stopTranscribing: () => void;
  appendTranscript: (text: string) => void;
  clearTranscript: () => void;

  // 操作 - 录音列表
  setRecordings: (recordings: Recording[]) => void;
  setCurrentRecording: (recording: Recording | null) => void;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;

  // WebSocket
  setWsConnected: (connected: boolean) => void;
  setWsError: (error: string | null) => void;

  // 重置
  reset: () => void;
}

// ============================================
// Store 实现
// ============================================

const initialState = {
  isRecording: false,
  isPaused: false,
  recordingDuration: 0,
  isTranscribing: false,
  currentTranscript: '',
  fullTranscript: '',
  recordings: [],
  currentRecording: null,
  wsConnected: false,
  wsError: null,
};

export const useRecordingStore = create<RecordingState>((set, get) => ({
  // 初始状态
  ...initialState,

  // === 录音操作 ===

  startRecording: () => {
    set({
      isRecording: true,
      isPaused: false,
      recordingDuration: 0,
      currentTranscript: '',
      fullTranscript: '',
    });
  },

  stopRecording: () => {
    set({
      isRecording: false,
      isPaused: false,
      isTranscribing: false,
    });
  },

  pauseRecording: () => {
    set({ isPaused: true });
  },

  resumeRecording: () => {
    set({ isPaused: false });
  },

  setRecordingDuration: (duration) => {
    set({ recordingDuration: duration });
  },

  // === 转写操作 ===

  startTranscribing: () => {
    set({ isTranscribing: true, currentTranscript: '', fullTranscript: '' });
  },

  stopTranscribing: () => {
    set({ isTranscribing: false });
  },

  appendTranscript: (text) => {
    const { fullTranscript } = get();
    set({
      currentTranscript: text,
      fullTranscript: fullTranscript + text,
    });
  },

  clearTranscript: () => {
    set({
      currentTranscript: '',
      fullTranscript: '',
    });
  },

  // === 录音列表操作 ===

  setRecordings: (recordings) => {
    set({ recordings });
  },

  setCurrentRecording: (recording) => {
    set({ currentRecording: recording });
  },

  addRecording: (recording) => {
    set((state) => ({
      recordings: [recording, ...state.recordings],
    }));
  },

  updateRecording: (id, updates) => {
    set((state) => ({
      recordings: state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
      currentRecording:
        state.currentRecording?.id === id
          ? { ...state.currentRecording, ...updates }
          : state.currentRecording,
    }));
  },

  // === WebSocket 状态 ===

  setWsConnected: (connected) => {
    set({ wsConnected: connected });
  },

  setWsError: (error) => {
    set({ wsError: error });
  },

  // === 重置 ===
  reset: () => {
    set(initialState);
  },
}));

// ============================================
// 选择器
// ============================================

export const selectIsRecording = (state: RecordingState) => state.isRecording;
export const selectIsPaused = (state: RecordingState) => state.isPaused;
export const selectCurrentTranscript = (state: RecordingState) => state.currentTranscript;
export const selectFullTranscript = (state: RecordingState) => state.fullTranscript;
export const selectWsConnected = (state: RecordingState) => state.wsConnected;
