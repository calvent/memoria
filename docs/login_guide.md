# 测试用户登录指南

## 测试账号信息

运行seed脚本后，已创建4个测试用户:

| 姓名 | 手机号 | 回忆录 | 章节数 |
|------|--------|--------|--------|
| 张天明 | 13800138001 | 我的人生回忆录 | 3 |
| 李秀芳 | 13800138002 | 我的教师生涯 | 5 |
| 王建国 | 13800138003 | 医者仁心:我的从医回忆 | 7 |
| 刘和平 | 13800138004 | 工厂岁月 | 4 |

---

## 登录方式

### 方式一: 手机号登录 (推荐用于测试)

已添加开发环境专用的手机号登录接口。

**API接口**:
```bash
POST /api/v1/auth/phone_login
Content-Type: application/json

{
  "phone": "13800138001"
}
```

**使用curl测试**:
```bash
# 登录张天明账号
curl -X POST http://localhost:8999/api/v1/auth/phone_login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138001"}'
```

**返回结果**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "role": "user"
    }
  }
}
```

### 方式二: 微信登录

如果在开发环境,可以使用mock code:

```bash
# 使用mock code登录
curl -X POST http://localhost:8999/api/v1/auth/wechat_login \
  -H "Content-Type: application/json" \
  -d '{"code": "dev"}'
```

注意: 这种方式会创建一个新用户,不会登录到seed创建的测试用户。

---

## 使用Token访问API

登录后获得token,在后续请求中携带token:

### 查看我的回忆录列表

```bash
# 替换 YOUR_TOKEN 为登录返回的token
curl http://localhost:8999/api/v1/memoir/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 查看回忆录详情

```bash
curl http://localhost:8999/api/v1/memoir/detail?memoir_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 查看章节列表

```bash
curl http://localhost:8999/api/v1/chapter/list?memoir_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 测试流程示例

### 完整测试示例 (张天明账号)

```bash
# 1. 登录
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8999/api/v1/auth/phone_login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138001"}')

# 2. 提取token (需要jq工具)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# 3. 查看我的回忆录
curl http://localhost:8999/api/v1/memoir/list \
  -H "Authorization: Bearer $TOKEN"

# 4. 查看第一个回忆录的详情
curl http://localhost:8999/api/v1/memoir/detail?memoir_id=1 \
  -H "Authorization: Bearer $TOKEN"

# 5. 查看章节
curl http://localhost:8999/api/v1/chapter/list?memoir_id=1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 前端测试

如果要在小程序前端测试,需要修改前端代码以支持手机号登录:

### 临时登录方案

在前端登录页面,可以添加一个开发模式的手机号登录:

```typescript
// 开发环境使用手机号登录
async function devLogin(phone: string) {
  const response = await request.post('/api/v1/auth/phone_login', {
    data: { phone }
  });
  
  // 保存token
  Taro.setStorageSync('token', response.data.token);
  Taro.setStorageSync('refreshToken', response.data.refreshToken);
  
  return response.data;
}

// 使用示例
await devLogin('13800138001');
```

---

## 注意事项

> [!WARNING]
> **手机号登录接口仅在开发环境可用**  
> 生产环境(`NODE_ENV=production`)会返回错误。

> [!IMPORTANT]
> **Token有效期**
> - Access Token: 2小时
> - Refresh Token: 7天
> 
> Token过期后需要使用refresh_token接口刷新。

---

## 测试用户ID映射

如果需要直接在SQL中查询用户数据:

```sql
-- 查看所有用户
SELECT id, phone, wechat_openid FROM users;

-- 查看某用户的回忆录
SELECT m.* FROM memoirs m 
JOIN users u ON m.user_id = u.id 
WHERE u.phone = '13800138001';

-- 查看某回忆录的章节
SELECT c.* FROM chapters c
JOIN memoirs m ON c.memoir_id = m.id
JOIN users u ON m.user_id = u.id
WHERE u.phone = '13800138001'
ORDER BY c.order;
```

---

## 快速开始

```bash
# 1. 确保后端服务运行
cd backend-service-py
python -m uvicorn app.main:app --reload

# 2. 填充测试数据
python seed_data.py

# 3. 测试登录 (张天明)
curl -X POST http://localhost:8999/api/v1/auth/phone_login \
  -H "Content-Type: application/json" \
  -d '{"phone": "13800138001"}'

# 4. 使用返回的token查看数据
# ... (见上面的示例)
```

现在你可以使用任意一个测试账号登录并查看对应的回忆录了！
