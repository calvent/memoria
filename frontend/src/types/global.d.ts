/**
 * 全局类型定义
 */

declare global {
  /**
   * 环境变量
   */
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      API_URL?: string;
      WS_URL?: string;
    }
  }

  /**
   * 窗口对象扩展
   */
  interface Window {
    __INITIAL_STATE__?: any;
  }
}

/**
 * Taro 相关类型补充
 */
declare module '@tarojs/taro' {
  namespace Taro {
    interface RecorderManager {
      onFrameRecorded: (callback: (res: { frameBuffer: ArrayBuffer }) => void) => void;
    }
  }
}

export {};
