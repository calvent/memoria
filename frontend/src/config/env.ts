/**
 * 环境变量配置
 * 
 * Taro 环境变量前缀：TARO_APP_
 * 使用方式：process.env.TARO_APP_API_URL
 */

interface EnvConfig {
    // API 服务地址
    apiUrl: string;
    // WebSocket 服务地址
    wsUrl: string;
    // 环境标识
    env: 'development' | 'production';
}

/**
 * 获取环境变量配置
 */
function getEnvConfig(): EnvConfig {
    return {
        apiUrl: process.env.TARO_APP_API_URL || 'http://localhost:8999',
        wsUrl: process.env.TARO_APP_WS_URL || 'ws://localhost:8999',
        env: (process.env.TARO_APP_ENV as any) || 'development',
    };
}

export const envConfig = getEnvConfig();

// 导出常用配置
export const API_BASE_URL = envConfig.apiUrl;
export const WS_BASE_URL = envConfig.wsUrl;
export const IS_DEV = envConfig.env === 'development';
export const IS_PROD = envConfig.env === 'production';

// 日志
if (IS_DEV) {
    console.log('📱 前端环境配置:', {
        API_BASE_URL,
        WS_BASE_URL,
        ENV: envConfig.env,
    });
}
