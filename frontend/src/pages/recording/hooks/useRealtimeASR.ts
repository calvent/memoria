/**
 * 实时语音识别 Hook
 *
 * 集成录音管理器和 WebSocket，实现实时语音转文字
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Taro from '@tarojs/taro';
import { useRealtimeASR as useWS } from '@/services/websocket';
import { useRecordingStore } from '@/stores/recording';

// ============================================
// 类型定义
// ============================================

export interface UseRealtimeASROptions {
  /** 回调函数：收到转写文本 */
  onTranscript?: (text: string) => void;
  /** 回调函数：识别完成 */
  onComplete?: (fullText: string) => void;
  /** 回调函数：发生错误 */
  onError?: (error: Error) => void;
}

export interface UseRealtimeASRResult {
  /** WebSocket 是否已连接 */
  isConnected: boolean;
  /** 是否正在录音 */
  isRecording: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 当前转写文本 */
  currentTranscript: string;
  /** 完整转写文本 */
  fullTranscript: string;
  /** 录音时长（秒） */
  duration: number;
  /** 错误信息 */
  error: string | null;
  /** 开始录音 */
  startRecording: () => Promise<void>;
  /** 停止录音 */
  stopRecording: () => Promise<void>;
  /** 暂停录音 */
  pauseRecording: () => void;
  /** 恢复录音 */
  resumeRecording: () => void;
  /** 清除转写文本 */
  clearTranscript: () => void;
}

// ============================================
// Hook 实现
// ============================================

export const useRealtimeASR = (options: UseRealtimeASROptions = {}): UseRealtimeASRResult => {
  const { onTranscript, onComplete, onError } = options;

  // Store 状态
  const {
    isRecording,
    isPaused,
    currentTranscript,
    fullTranscript,
    wsConnected,
    wsError,
  } = useRecordingStore();

  // 本地状态
  const [duration, setDuration] = useState(0);
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket Hook
  const ws = useWS();

  /**
   * 录音管理器配置
   */
  const recorderConfig = {
    duration: 600000, // 最长 10 分钟
    sampleRate: 16000 as const,
    numberOfChannels: 1 as const,
    encodeBitRate: 256000, // PCM 16kHz 单声道 16bit = 256kbps
    format: 'PCM' as const, // ASR 要求 PCM16/16kHz
    frameSize: 3, // ~3KB ≈ 100ms 的 PCM16/16kHz 音频
  };

  /**
   * 开始录音
   */
  const startRecording = useCallback(async () => {
    try {
      // 1. 连接 WebSocket
      if (!ws.isConnected) {
        await ws.connect();
      }

      // 2. 初始化录音管理器
      const recorderManager = Taro.getRecorderManager();
      recorderManagerRef.current = recorderManager;

      // 3. 监听录音事件
      recorderManager.onStart(() => {
        console.log('[ASR] 开始录音');
        useRecordingStore.getState().startRecording();
        useRecordingStore.getState().startTranscribing();
      });

      recorderManager.onFrameRecorded((res) => {
        // 发送音频帧到 WebSocket
        if (ws.isConnected()) {
          ws.sendAudio(res.frameBuffer);
        }
      });

      recorderManager.onStop((res) => {
        console.log('[ASR] 录音结束', res);
        const { tempFilePath, duration } = res;

        // 停止 WebSocket 识别
        ws.endRecording();

        // 触发完成回调
        if (onComplete) {
          onComplete(fullTranscript);
        }

        return { tempFilePath, duration };
      });

      recorderManager.onError((error) => {
        console.error('[ASR] 录音错误', error);
        const err = new Error('录音失败');
        if (onError) {
          onError(err);
        }
      });

      // 4. 开始录音
      recorderManager.start(recorderConfig);

      // 5. 开始计时（先清除可能存在的旧计时器）
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('[ASR] 启动失败', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [ws, fullTranscript, onComplete, onError]);

  /**
   * 停止录音
   */
  const stopRecording = useCallback(async () => {
    if (recorderManagerRef.current) {
      recorderManagerRef.current.stop();
    }

    // 清理定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 更新状态
    useRecordingStore.getState().stopRecording();
    setDuration(0);
  }, []);

  /**
   * 暂停录音
   */
  const pauseRecording = useCallback(() => {
    useRecordingStore.getState().pauseRecording();
  }, []);

  /**
   * 恢复录音
   */
  const resumeRecording = useCallback(() => {
    useRecordingStore.getState().resumeRecording();
  }, []);

  /**
   * 清除转写文本
   */
  const clearTranscript = useCallback(() => {
    useRecordingStore.getState().clearTranscript();
    setDuration(0);
  }, []);

  /**
   * 监听转写结果
   */
  useEffect(() => {
    const unsubscribe = ws.onTranscript((text) => {
      useRecordingStore.getState().appendTranscript(text);
      if (onTranscript) {
        onTranscript(text);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [ws, onTranscript]);

  /**
   * 清理副作用
   */
  useEffect(() => {
    return () => {
      // 清理定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // 停止录音
      if (recorderManagerRef.current) {
        recorderManagerRef.current.stop();
      }

      // 关闭 WebSocket
      if (ws.isConnected()) {
        ws.disconnect();
      }
    };
  }, []);

  return {
    isConnected: wsConnected,
    isRecording,
    isPaused,
    currentTranscript,
    fullTranscript,
    duration,
    error: wsError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  };
};

export default useRealtimeASR;
