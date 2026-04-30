# AI 老年回忆录 - 前端项目

基于 Taro + React + TypeScript 的跨端小程序应用。

## 技术栈

- **框架**: Taro 4.x + React 18.x
- **语言**: TypeScript 5.x
- **状态管理**: Zustand 4.x
- **样式**: Tailwind CSS 3.x + SCSS Modules
- **HTTP**: Taro.request（封装了 Axios 风格的 API）
- **实时通信**: WebSocket

## 项目结构

```
frontend/
├── src/
│   ├── pages/              # 页面
│   │   ├── home/           # 首页
│   │   ├── recording/      # 录音页
│   │   ├── memoir/         # 回忆录列表
│   │   ├── memoir-detail/  # 回忆录详情
│   │   ├── chapter-edit/   # 章节编辑
│   │   └── profile/        # 个人中心
│   │
│   ├── components/         # 全局组件
│   │   ├── Button/         # 按钮
│   │   ├── Input/          # 输入框
│   │   ├── Modal/          # 模态框
│   │   └── Avatar/         # 头像
│   │
│   ├── hooks/              # 全局 Hooks
│   ├── services/           # API 服务
│   ├── stores/             # Zustand 状态管理
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   └── styles/             # 全局样式
│
├── config/                 # 构建配置
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
API_URL=http://localhost:8999
WS_URL=ws://localhost:8999
```

### 3. 开发命令

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5
```

### 4. 构建生产版本

```bash
# 微信小程序
npm run build:weapp

# H5
npm run build:h5
```

## 设计系统

本项目采用**设计令牌（Design Tokens）**系统，确保视觉一致性。

### 颜色

- **主色调**: 温暖的橙色系（#f59e0b）- 亲切、活力
- **背景色**: 温暖的米白色（#fafaf9）- 不刺眼
- **文字色**: 深灰色（#1c1917）- 高对比度

### 字体

- **大字体**: 适合老年人阅读（正文 18px）
- **宽松行高**: 1.5-1.75 - 提高可读性
- **清晰层次**: Display/H1/H2/H3/Body/Small/Caption

### 间距

- **8px 基础系统**: 4px, 8px, 16px, 24px, 32px, ...
- **大触控区**: 按钮最小 48px 高 - 方便老年人操作

### 圆角

- **柔和圆角**: 8px（按钮/输入框）- 亲和力
- **大圆角**: 12-20px（卡片/模态框）- 现代感

## 核心功能

### 1. 实时语音识别

- WebSocket 实时连接
- 流式音频传输
- 实时转写显示
- 断线重连机制

**Hook**: `useRealtimeASR`

### 2. 状态管理

- **auth**: 用户认证状态
- **memoir**: 回忆录状态
- **recording**: 录音状态

### 3. API 服务

统一的请求封装，支持：
- 自动添加 Token
- Token 过期自动刷新
- 统一错误处理
- 文件上传

## 开发指南

### 新增页面

1. 在 `src/pages/` 下创建页面目录
2. 在 `app.config.ts` 中注册页面路径
3. 创建 `index.tsx` 和 `index.module.scss`

### 新增组件

1. 在 `src/components/` 下创建组件目录
2. 创建 `index.tsx` 和 `index.module.scss`
3. 使用设计令牌而非硬编码值

### 使用 Store

```typescript
import { useAuthStore } from '@/stores/auth';

const MyComponent = () => {
  const { user, token, logout } = useAuthStore();
  // ...
};
```

### 调用 API

```typescript
import { getMemoirList } from '@/services/memoir';

const loadMemoirs = async () => {
  const data = await getMemoirList({ page: 1, pageSize: 10 });
  // ...
};
```

## 注意事项

1. **不做加法，只做减法**: 保持简单，避免过度工程化
2. **职责清晰**: 验证只负责验证，执行只负责执行
3. **从根本解决问题**: 不要采取防御性编程
4. **合理拆分**: 拆分必须减少重复、提升可读性
5. **老年友好**: 大字体、高对比度、大触控区

## 与后端配合

前端正在与后端同步开发，请确保：

1. API 接口与后端定义一致
2. WebSocket 消息格式匹配
3. 数据类型与后端返回一致

## License

MIT
