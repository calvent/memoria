/**
 * WebSocket 连接管理
 *
 * 用于实时语音识别的 WebSocket 连接
 */

import Taro from '@tarojs/taro';
import { useAuthStore } from '@/stores/auth';
import { useRecordingStore } from '@/stores/recording';
import { WS_BASE_URL } from '@/config/env';

// ============================================
// 类型定义
// ============================================

export type WebSocketMessageType =
  | 'open'
  | 'close'
  | 'error'
  | 'message'
  | 'transcript'
  | 'info';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: any;
}

export type WebSocketListener = (message: WebSocketMessage) => void;

// ============================================
// WebSocket 管理类
// ============================================

class WebSocketManager {
  private ws: Taro.SocketTask | null = null;
  private url: string | null = null;
  private listeners: WebSocketListener[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 8999;

  /**
   * 连接 WebSocket
   */
  connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 获取 Token
      const token = useAuthStore.getState().token || Taro.getStorageSync('token');

      if (!token) {
        reject(new Error('未登录'));
        return;
      }

      // 构建 WebSocket URL
      this.url = `${wsUrl}?token=${token}`;

      // Taro.connectSocket 返回 SocketTask
      // 注意：某些版本的 @tarojs/taro 类型定义可能不准确
      this.ws = Taro.connectSocket({
        url: this.url,
      }) as unknown as Taro.SocketTask;

      // ✅ 添加 null 检查
      if (!this.ws) {
        reject(new Error('WebSocket 创建失败'));
        return;
      }

      // 监听连接打开
      this.ws.onOpen(() => {
        console.log('[WebSocket] 连接已打开');
        this.reconnectAttempts = 0;
        this.emit({ type: 'open' });
        resolve();
      });

      // 监听连接关闭
      this.ws.onClose(() => {
        console.log('[WebSocket] 连接已关闭');
        this.emit({ type: 'close' });
      });

      // 监听错误
      this.ws.onError((error) => {
        console.error('[WebSocket] 错误', error);
        this.emit({ type: 'error', data: error });
        this.handleReconnect();
        reject(error);
      });

      // 监听消息
      this.ws.onMessage((res) => {
        try {
          const data = JSON.parse(res.data as string);
          this.emit({ type: 'message', data });

          // 转写消息特殊处理
          if (data.type === 'transcript') {
            this.emit({ type: 'transcript', data: data.text });
          } else if (data.type === 'info') {
            this.emit({ type: 'info', data: data.message });
          }
        } catch (error) {
          console.error('[WebSocket] 解析消息失败', error);
        }
      });
    });
  }

  /**
   * 发送消息
   */
  send(data: any) {
    if (!this.ws) {
      console.error('[WebSocket] 未连接');
      return;
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send({ data: message });
  }

  /**
   * 发送音频数据
   */
  sendAudio(audioData: ArrayBuffer) {
    if (!this.ws) {
      console.error('[WebSocket] 未连接');
      return;
    }

    this.ws.send({ data: audioData });
  }

  /**
   * 关闭连接
   */
  close() {
    if (this.ws) {
      this.ws.close({});
      this.ws = null;
    }
    this.url = null;
    this.listeners = [];
  }

  /**
   * 获取连接状态
   */
  getConnected() {
    return this.ws !== null;
  }

  /**
   * 重连
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 超过最大重连次数');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.url) {
        this.connect(this.url).catch((error) => {
          console.error('[WebSocket] 重连失败', error);
        });
      }
    }, this.reconnectDelay);
  }

  /**
   * 添加监听器
   */
  on(listener: WebSocketListener) {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   */
  off(listener: WebSocketListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emit(message: WebSocketMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error('[WebSocket] 监听器错误', error);
      }
    });
  }
}

// ============================================
// 导出全局实例
// ============================================

export const wsManager = new WebSocketManager();

/**
 * 便捷 Hook：使用实时语音识别 WebSocket
 */
export const useRealtimeASR = () => {
  /**
   * 开始连接
   */
  const connect = async () => {
    try {
      await wsManager.connect(`${WS_BASE_URL}/api/v1/speech/realtime`);
      useRecordingStore.getState().setWsConnected(true);
    } catch (error) {
      console.error('[ASR] 连接失败', error);
      useRecordingStore.getState().setWsConnected(false);
      throw error;
    }
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    wsManager.close();
    useRecordingStore.getState().setWsConnected(false);
  };

  /**
   * 发送音频数据
   */
  const sendAudio = (audioData: ArrayBuffer) => {
    wsManager.sendAudio(audioData);
  };

  /**
   * 结束录音
   */
  const endRecording = () => {
    wsManager.send({ type: 'end' });
  };

  /**
   * 监听消息
   */
  const onMessage = (listener: WebSocketListener) => {
    wsManager.on(listener);
    return () => wsManager.off(listener);
  };

  /**
   * 监听转写文本
   */
  const onTranscript = (listener: (text: string) => void) => {
    const transcriptListener: WebSocketListener = (message) => {
      if (message.type === 'transcript') {
        listener(message.data);
      }
    };
    wsManager.on(transcriptListener);
    return () => wsManager.off(transcriptListener);
  };

  /**
   * 获取连接状态
   */
  const isConnected = () => {
    return wsManager.getConnected();
  };

  return {
    connect,
    disconnect,
    sendAudio,
    endRecording,
    onMessage,
    onTranscript,
    isConnected,
  };
};
