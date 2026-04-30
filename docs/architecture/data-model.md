# Memoria 数据模型设计

## 关键洞察

### 产品使用场景

老人创建回忆录的实际流程：

1. **随意录音**：老人讲述是跳跃的，今天讲童年，明天讲退休，后天又讲童年
2. **系统转录**：将语音转为文字
3. **AI识别**：提取关键信息（标题、时间、地点、关键词）
4. **AI归类**：积累足够故事后，自动按人生阶段归类成章节
5. **用户调整**：可手动调整归类、修改内容
6. **生成回忆录**：汇总成完整的回忆录

### 核心设计原则

1. **Story 是原子输入单元**：应该先独立存在，不强制归类
2. **Chapter 是后期产物**：是AI整理后的容器，而非输入时的必要结构
3. **支持"待整理"状态**：Story.chapter_id 可为空
4. **职责分离**：Story 管内容，Chapter 管组织，Recording 管录音

---

## 数据模型

### 层级关系

```
Memoir（回忆录）- 一本书
  │
  ├─ Story（故事）- 原子内容单元
  │    ├─ chapter_id: 可为空（待整理状态）
  │    └─ recording_id: 可选关联录音
  │
  └─ Chapter（章节）- AI整理后的容器
       └─ stories: 包含多个归类后的故事
```

### 数据流

```
用户录音
    ↓
Recording（录音原始数据 + 转录文本）
    ↓ AI处理
Story（提取标题、时间、地点，is_ai_processed=true）
    ↓ AI归类 / 用户调整
Story.chapter_id = xxx（归入某章节）
    ↓
Chapter.stories（章节包含的故事列表）
    ↓
Memoir（完整呈现回忆录）
```

---

## 表结构设计

### Story（故事）

回忆录的最小内容单元，支持独立存在。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| memoir_id | BigInteger | 所属回忆录（必填） |
| chapter_id | BigInteger/Null | 所属章节（可空，表示待整理） |
| title | String(200) | 故事标题，如"进厂第一天" |
| content | Text | 故事正文 |
| happened_at | String(100)/Null | 发生时间，如"1970年8月" |
| location | String(200)/Null | 发生地点 |
| keywords | Text/Null | 关键词（JSON数组），便于AI归类 |
| order | Integer | 在章节内的排序 |
| source | String(20) | 来源：'recording'/'manual'/'ai' |
| is_ai_processed | Boolean | AI是否已处理 |
| recording_id | BigInteger/Null | 关联的录音 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### Chapter（章节）

故事的容器，通常由AI生成。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInteger | 主键 |
| memoir_id | BigInteger | 所属回忆录 |
| title | String(200) | 章节标题，如"学徒时光 (1970-1975)" |
| description | Text/Null | 章节概述/核心主题 |
| time_period | String(100)/Null | 时间段，如"1970-1975" |
| introduction | Text/Null | AI生成的章节开头语 |
| order | Integer | 章节排序 |
| type | String(50)/Null | 章节类型 |
| is_ai_generated | Boolean | 是否AI生成 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### Recording（录音）

保持现有设计，专注于录音元数据。

---

## 状态说明

### Story 状态

| 状态 | chapter_id | is_ai_processed | 说明 |
|------|------------|-----------------|------|
| 原始录入 | null | false | 刚从录音转录，未处理 |
| AI已处理 | null | true | AI提取了标题等，但未归类 |
| 已归类 | 非空 | true | 已归入某章节 |

---

## 迁移说明

从现有架构迁移：
1. 创建 Story 表
2. 将 Chapter.content 中的回忆片段拆分为多个 Story
3. Chapter 保留 title、description、order 等元数据
4. 废弃 Chapter.content 或改为 introduction
