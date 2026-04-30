# AI 老年回忆录 - 前端技术文档

> 基于 Taro + React 的跨端小程序应用

---

## 一、技术选型

### 1.1 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Taro** | 4.x | 跨端框架 |
| **React** | 18.x | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Zustand** | 4.x | 状态管理 |
| **React Query** | 5.x | 服务端状态管理 |
| **Tailwind CSS** | 3.x | 样式方案 |
| **Zod** | 最新 | 运行时校验 |

### 1.2 为什么选择 Taro？

- ✅ 一套代码多端运行（微信小程序、H5、APP）
- ✅ React 生态完整支持
- ✅ 官方维护，社区活跃
- ✅ 开发体验与 React 一致
- ✅ TypeScript 友好

---

## 二、项目结构

```
frontend/
├── src/
│   ├── app.config.ts         # Taro 应用配置
│   ├── app.ts                # 应用入口
│   │
│   ├── pages/                # 页面
│   │   ├── home/             # 首页
│   │   │   ├── index.tsx
│   │   │   └── index.module.scss
│   │   │
│   │   ├── recording/        # 实时录音页
│   │   │   ├── index.tsx
│   │   │   ├── components/   # 页面组件
│   │   │   │   ├── AudioWaveform.tsx
│   │   │   │   └── TranscriptDisplay.tsx
│   │   │   └── hooks/        # 页面 Hooks
│   │   │       └── useRealtimeASR.ts
│   │   │
│   │   ├── memoir/           # 回忆录列表
│   │   ├── memoir-detail/    # 回忆录详情
│   │   ├── chapter-edit/     # 章节编辑
│   │   └── profile/          # 个人中心
│   │
│   ├── components/           # 全局组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Avatar/
│   │
│   ├── hooks/                # 全局 Hooks
│   │   ├── useAuth.ts        # 认证
│   │   ├── useWebSocket.ts   # WebSocket
│   │   └── useUpload.ts      # 文件上传
│   │
│   ├── services/             # API 服务
│   │   ├── api.ts            # Axios 实例
│   │   ├── auth.ts
│   │   ├── memoir.ts
│   │   ├── recording.ts
│   │   └── websocket.ts
│   │
│   ├── stores/               # Zustand 状态管理
│   │   ├── auth.ts           # 用户认证状态
│   │   ├── memoir.ts         # 回忆录状态
│   │   └── recording.ts      # 录音状态
│   │
│   ├── utils/                # 工具函数
│   │   ├── request.ts        # 请求封装
│   │   ├── storage.ts        # 本地存储
│   │   ├── format.ts         # 格式化
│   │   └── validator.ts      # 校验
│   │
│   ├── types/                # TypeScript 类型
│   │   ├── api.d.ts
│   │   ├── models.d.ts
│   │   └── global.d.ts
│   │
│   └── styles/               # 全局样式
│       ├── variables.scss    # 变量
│       └── common.scss       # 公共样式
│
├── config/                   # 构建配置
│   └── index.ts
│
├── project.config.json       # 微信小程序配置
├── package.json
└── tsconfig.json
```

---

## 三、核心功能实现

### 3.1 实时语音识别（WebSocket）

**核心 Hook: `useRealtimeASR.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';

interface UseRealtimeASROptions {
  onTranscript: (text: string) => void;
  onError: (error: Error) => void;
}

export function useRealtimeASR({ onTranscript, onError }: UseRealtimeASROptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef<Taro.SocketTask | null>(null);
  const recorderManagerRef = useRef<Taro.RecorderManager | null>(null);

  // 建立 WebSocket 连接
  const connect = async () => {
    try {
      const token = Taro.getStorageSync('token');
      const wsUrl = `${process.env.WS_URL}/speech/realtime?token=${token}`;

      wsRef.current = Taro.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('WebSocket 连接成功');
        },
      });

      wsRef.current.onOpen(() => {
        setIsConnected(true);
      });

      wsRef.current.onMessage((res) => {
        const data = JSON.parse(res.data as string);
        if (data.type === 'transcript') {
          onTranscript(data.text);
        }
      });

      wsRef.current.onError((error) => {
        onError(new Error('WebSocket 连接错误'));
      });

      wsRef.current.onClose(() => {
        setIsConnected(false);
      });
    } catch (error) {
      onError(error as Error);
    }
  };

  // 开始录音
  const startRecording = async () => {
    if (!isConnected) {
      await connect();
    }

    const recorderManager = Taro.getRecorderManager();
    recorderManagerRef.current = recorderManager;

    recorderManager.onStart(() => {
      setIsRecording(true);
    });

    recorderManager.onFrameRecorded((res) => {
      // 发送音频帧到 WebSocket
      if (wsRef.current && isConnected) {
        wsRef.current.send({
          data: res.frameBuffer,
        });
      }
    });

    recorderManager.start({
      duration: 600000, // 最长10分钟
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'pcm',
      frameSize: 50, // 每50ms发送一次
    });
  };

  // 停止录音
  const stopRecording = () => {
    if (recorderManagerRef.current) {
      recorderManagerRef.current.stop();
      setIsRecording(false);
    }

    if (wsRef.current) {
      wsRef.current.send({
        data: JSON.stringify({ type: 'end' }),
      });
      wsRef.current.close({});
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  // 清理
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return {
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
  };
}
```

**页面使用示例:**

```typescript
// pages/recording/index.tsx
import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useRealtimeASR } from './hooks/useRealtimeASR';

export default function RecordingPage() {
  const [transcript, setTranscript] = useState('');
  const [fullText, setFullText] = useState('');

  const { isRecording, startRecording, stopRecording } = useRealtimeASR({
    onTranscript: (text) => {
      setTranscript(text);
      setFullText((prev) => prev + text);
    },
    onError: (error) => {
      console.error('录音错误:', error);
    },
  });

  return (
    <View className="recording-page">
      <View className="transcript-display">
        <Text>{fullText}</Text>
        {isRecording && <Text className="pulse">{transcript}</Text>}
      </View>

      <Button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? '停止录音' : '开始录音'}
      </Button>
    </View>
  );
}
```

---

### 3.2 状态管理（Zustand）

**认证状态 `stores/auth.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Taro from '@tarojs/taro';

interface User {
  id: string;
  phone?: string;
  wechatOpenid: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        Taro.setStorageSync('token', token);
        set({ token });
      },

      logout: () => {
        Taro.removeStorageSync('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      getStorage: () => ({
        getItem: (name) => Taro.getStorageSync(name),
        setItem: (name, value) => Taro.setStorageSync(name, value),
        removeItem: (name) => Taro.removeStorageSync(name),
      }),
    }
  )
);
```

**回忆录状态 `stores/memoir.ts`**

```typescript
import { create } from 'zustand';

interface Memoir {
  id: string;
  title: string;
  coverImage?: string;
  status: 'draft' | 'generating' | 'completed';
  createdAt: string;
}

interface MemoirState {
  memoirs: Memoir[];
  currentMemoir: Memoir | null;
  
  setMemoirs: (memoirs: Memoir[]) => void;
  setCurrentMemoir: (memoir: Memoir) => void;
  addMemoir: (memoir: Memoir) => void;
  updateMemoir: (id: string, updates: Partial<Memoir>) => void;
}

export const useMemoirStore = create<MemoirState>((set) => ({
  memoirs: [],
  currentMemoir: null,

  setMemoirs: (memoirs) => set({ memoirs }),
  setCurrentMemoir: (memoir) => set({ currentMemoir: memoir }),
  
  addMemoir: (memoir) => set((state) => ({ 
    memoirs: [memoir, ...state.memoirs] 
  })),

  updateMemoir: (id, updates) => set((state) => ({
    memoirs: state.memoirs.map((m) => 
      m.id === id ? { ...m, ...updates } : m
    ),
  })),
}));
```

---

### 3.3 服务端状态管理（React Query）

**API 服务封装 `services/memoir.ts`**

```typescript
import { request } from '@/utils/request';

export interface CreateMemoirInput {
  title: string;
  elderId: string;
  coverImage?: string;
}

export const memoirApi = {
  // 获取列表
  getList: async () => {
    return request<{ items: Memoir[] }>({
      url: '/api/v1/memoir/list',
      method: 'GET',
    });
  },

  // 创建回忆录
  create: async (data: CreateMemoirInput) => {
    return request<Memoir>({
      url: '/api/v1/memoir/create',
      method: 'POST',
      data,
    });
  },

  // 获取详情
  getDetail: async (id: string) => {
    return request<Memoir>({
      url: `/api/v1/memoir/detail?id=${id}`,
      method: 'GET',
    });
  },
};
```

**React Query Hooks**

```typescript
// hooks/useMemoirs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoirApi } from '@/services/memoir';

export function useMemoirs() {
  return useQuery({
    queryKey: ['memoirs'],
    queryFn: memoirApi.getList,
  });
}

export function useCreateMemoir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: memoirApi.create,
    onSuccess: () => {
      // 刷新列表
      queryClient.invalidateQueries({ queryKey: ['memoirs'] });
    },
  });
}
```

**页面使用:**

```typescript
import { useMemoirs, useCreateMemoir } from '@/hooks/useMemoirs';

export default function MemoirListPage() {
  const { data, isLoading } = useMemoirs();
  const createMemoir = useCreateMemoir();

  const handleCreate = async () => {
    await createMemoir.mutateAsync({
      title: '新回忆录',
      elderId: 'xxx',
    });
  };

  if (isLoading) return <View>加载中...</View>;

  return (
    <View>
      {data?.items.map(memoir => (
        <View key={memoir.id}>{memoir.title}</View>
      ))}
      <Button onClick={handleCreate}>创建</Button>
    </View>
  );
}
```

---

### 3.4 微信授权登录

```typescript
// services/auth.ts
import Taro from '@tarojs/taro';
import { request } from '@/utils/request';

export async function wechatLogin() {
  try {
    // 1. 调用微信登录获取 code
    const { code } = await Taro.login();

    // 2. 发送 code 到后端
    const { data } = await request<{ token: string; user: User }>({
      url: '/api/v1/auth/wechat_login',
      method: 'POST',
      data: { code },
    });

    // 3. 保存 token 和用户信息
    const { setToken, setUser } = useAuthStore.getState();
    setToken(data.token);
    setUser(data.user);

    return data;
  } catch (error) {
    Taro.showToast({
      title: '登录失败',
      icon: 'none',
    });
    throw error;
  }
}
```

---

## 四、样式方案

### 4.1 Tailwind CSS + Taro

**配置 `config/index.ts`**

```typescript
export default {
  // ...
  plugins: [
    ['@tarojs/plugin-html'],
    ['taro-plugin-tailwind', {
      // 启用预设
      presets: [require('tailwind-preset-taro')],
    }],
  ],
};
```

**使用示例:**

```tsx
<View className="flex flex-col items-center justify-center h-screen bg-gray-50">
  <Text className="text-2xl font-bold text-gray-900">欢迎使用</Text>
  <Button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
    开始录音
  </Button>
</View>
```

---

## 五、路由与导航

### 5.1 页面配置

**app.config.ts**

```typescript
export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/recording/index',
    'pages/memoir/index',
    'pages/memoir-detail/index',
    'pages/chapter-edit/index',
    'pages/profile/index',
  ],
  
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AI老年回忆录',
    navigationBarTextStyle: 'black',
  },

  tabBar: {
    color: '#999',
    selectedColor: '#3b82f6',
    backgroundColor: '#fff',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png',
      },
      {
        pagePath: 'pages/memoir/index',
        text: '回忆录',
        iconPath: 'assets/icons/memoir.png',
        selectedIconPath: 'assets/icons/memoir-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png',
      },
    ],
  },
});
```

### 5.2 页面跳转

```typescript
import Taro from '@tarojs/taro';

// 普通跳转
Taro.navigateTo({ url: '/pages/recording/index' });

// 携带参数
Taro.navigateTo({ 
  url: `/pages/memoir-detail/index?id=${memoirId}` 
});

// Tab 切换
Taro.switchTab({ url: '/pages/home/index' });

// 返回
Taro.navigateBack({ delta: 1 });
```

---

## 六、环境配置

### 6.1 环境变量

```typescript
// config/index.ts
const ENV_CONFIG = {
  development: {
    API_URL: 'http://localhost:8999',
    WS_URL: 'ws://localhost:8999',
  },
  production: {
    API_URL: 'https://api.memoria.com',
    WS_URL: 'wss://api.memoria.com',
  },
};

export default ENV_CONFIG[process.env.NODE_ENV || 'development'];
```

---

## 七、构建与部署

### 7.1 开发命令

```json
{
  "scripts": {
    "dev:weapp": "taro build --type weapp --watch",
    "dev:h5": "taro build --type h5 --watch",
    "build:weapp": "taro build --type weapp",
    "build:h5": "taro build --type h5"
  }
}
```

### 7.2 微信小程序上传

```bash
# 1. 构建生产版本
npm run build:weapp

# 2. 使用微信开发者工具上传
# 或使用 miniprogram-ci 自动化上传
```

---

## 八、性能优化

### 8.1 代码分割

```typescript
// 使用 lazy + Suspense 实现按需加载
import { lazy, Suspense } from 'react';

const MemoirDetailPage = lazy(() => import('./pages/memoir-detail'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <MemoirDetailPage />
    </Suspense>
  );
}
```

### 8.2 图片优化

```tsx
import Taro from '@tarojs/taro';

// 使用 Taro.getImageInfo 预加载
Taro.getImageInfo({
  src: imageUrl,
  success: () => {
    // 图片加载成功
  },
});

// 懒加载
<Image 
  src={imageUrl} 
  lazyLoad 
  mode="aspectFill" 
/>
```

---

## 九、调试技巧

### 9.1 微信小程序调试

```typescript
// 使用 vConsole
if (process.env.NODE_ENV === 'development') {
  import('vconsole').then((VConsole) => {
    new VConsole.default();
  });
}

// 查看网络请求
Taro.addInterceptor((chain) => {
  console.log('Request:', chain.requestParams);
  return chain.proceed(chain.requestParams).then((res) => {
    console.log('Response:', res);
    return res;
  });
});
```

---

## 十、最佳实践

1. **组件设计**：遵循单一职责原则，拆分可复用组件
2. **性能优化**：合理使用 React.memo、useMemo、useCallback
3. **类型安全**：所有接口定义 TypeScript 类型
4. **错误处理**：统一错误处理，友好的错误提示
5. **测试**：关键业务逻辑编写单元测试
