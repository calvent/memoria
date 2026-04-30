# 🚀 AI 老年回忆录 - 前端启动指南

## 📋 前置要求

在启动前端之前，请确保：

1. **Node.js 版本** >= 18.0.0
2. **npm 版本** >= 8.0.0
3. **后端服务已启动**（端口 8999）
4. **MinIO 服务已启动**（端口 9000，如需使用文件上传）

---

## 📦 步骤 1：安装依赖

```bash
cd /Users/liaochui/code/Memoria/frontend
npm install
```

**注意：** 如果安装速度慢，可以使用淘宝镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

---

## ⚙️ 步骤 2：配置环境变量

创建 `.env` 文件（可选，默认已配置）：

```bash
# 开发环境
NODE_ENV=development

# API 地址
API_URL=http://localhost:8999
WS_URL=ws://localhost:8999
```

---

## 🎯 步骤 3：启动开发服务器

### 方式一：微信小程序（推荐）

```bash
npm run dev:weapp
```

**启动后：**
1. 打开 **微信开发者工具**
2. 导入项目：选择 `/Users/liaochui/code/Memoria/frontend/dist` 目录
3. 项目类型选择：**小程序**
4. AppID 选择：**测试号**（如果没有正式账号）

### 方式二：H5（Web 浏览器）

```bash
npm run dev:h5
```

**启动后：**
- 打开浏览器访问：`http://localhost:10086`（或控制台显示的端口）

---

## 📱 开发者工具配置（微信小程序）

### 1. 下载微信开发者工具
- 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 下载并安装对应系统版本

### 2. 配置项目
```
项目名称：AI 老年回忆录
目录：/Users/liaochui/code/Memoria/frontend/dist
AppID：测试号
开发模式：不使用云服务
```

### 3. 开启调试
- 点击右上角「详情」
- 本地设置：✅ 不校验合法域名
- 调试基础库：选择较新版本

---

## 🔧 常见问题

### Q1: 安装依赖时报错
**A:** 删除 `node_modules` 和 `package-lock.json`，重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q2: 微信开发者工具无法预览
**A:** 检查以下几点：
- ✅ 确保选择了 `dist` 目录而不是项目根目录
- ✅ 确保选择了「小程序」项目类型
- ✅ 确保开启了「不校验合法域名」

### Q3: 网络请求失败
**A:** 
- 确保后端服务已启动（http://localhost:8999）
- 检查 API_URL 配置是否正确
- 查看微信开发者工具的控制台报错信息

### Q4: WebSocket 连接失败
**A:**
- 确保后端 WebSocket 服务已启动
- 检查 WS_URL 配置：`ws://localhost:8999`
- 查看后端日志确认 WebSocket 服务器正常运行

### Q5: 文件上传失败
**A:**
- 确保 MinIO 服务已启动（端口 9000）
- 检查 MinIO 配置是否正确
- 查看后端日志中的错误信息

---

## 📂 项目结构

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
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── Avatar/
│   │
│   ├── services/           # API 服务
│   ├── stores/             # 状态管理
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型
│   ├── styles/             # 全局样式
│   ├── app.ts              # 应用入口
│   └── app.config.ts       # 应用配置
│
├── dist/                   # 编译输出（微信开发者工具导入此目录）
├── config/                 # Taro 配置
├── package.json
└── tsconfig.json
```

---

## 🛠️ 开发命令速查

```bash
# 安装依赖
npm install

# 微信小程序开发
npm run dev:weapp

# H5 开发
npm run dev:h5

# 微信小程序构建（生产）
npm run build:weapp

# H5 构建（生产）
npm run build:h5

# 代码检查
npm run lint

# 代码修复
npm run lint:fix
```

---

## 📝 注意事项

### 1. 不要启动前后端服务
根据用户的全局指令，**后端服务已启动**，前端只需连接即可。

### 2. Python 解释器
项目中使用的 Python 解释器：
```
/Users/liaochui/miniconda3/envs/jrbx/bin/python
```
前端项目不需要 Python，仅后端 AI 服务需要。

### 3. 开发原则
- 做减法，不做加法
- 保持职责单一
- 从根本解决问题，不采取防御性编程

---

## 🎉 开始开发

现在您可以：

1. **启动前端开发服务器**
   ```bash
   npm run dev:weapp  # 或 npm run dev:h5
   ```

2. **打开微信开发者工具**
   - 导入 `dist` 目录
   - 开始预览和调试

3. **实时开发**
   - 修改代码会自动重新编译
   - 在微信开发者工具中刷新即可看到变化

4. **查看日志**
   - 微信开发者工具：控制台 → Console
   - 后端日志：查看终端输出

祝开发顺利！🚀
