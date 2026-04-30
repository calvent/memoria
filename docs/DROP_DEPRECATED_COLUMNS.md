# 删除 Chapters 表废弃字段 - 执行指南

## 概述

本指南说明如何删除 `chapters` 表中的废弃字段，这些字段在新的数据模型中已不再使用。

## 废弃字段列表

以下字段将被删除：

1. **`content`** - 已被 `introduction` 和 `stories` 数组替代
2. **`recording_ids`** - 录音现在通过 `Story.recording_id` 关联
3. **`media_ids`** - 媒体文件应该关联到 Story

## 代码更新状态

### ✅ 已完成的更新

#### 后端

1. **ORM 模型** (`app/models/__init__.py`)
   - ✅ Chapter 模型已移除废弃字段
   - ✅ 添加了新字段：`description`, `time_period`, `introduction`
   - ✅ 添加了 `stories` 关系

2. **Schema** (`app/schemas/chapter.py`)
   - ✅ ChapterCreate/Update 已使用新字段
   - ✅ ChapterResponse 保留 `content` 字段用于向后兼容（映射自 `introduction`）

3. **Service** (`app/services/chapter.py`)
   - ✅ `serialize_chapter` 已更新，将 `introduction` 映射到 `content`
   - ✅ 不再访问或序列化废弃字段

#### 前端

1. **类型定义** (`frontend/src/services/chapter.ts`)
   - ✅ Chapter 接口已移除 `recordingIds`, `mediaIds`, `memories`
   - ✅ 添加了新字段：`description`, `timePeriod`, `introduction`, `stories`
   - ✅ 保留 `content` 用于向后兼容

2. **API 函数**
   - ✅ createChapter/updateChapter 参数已更新
   - ✅ generateChapter 使用 `storyIds` 替代 `recordingIds`

### ⚠️ 需要检查的文件

以下文件可能还有对废弃字段的引用，需要手动检查：

- `frontend/src/types/api.d.ts` (第126行)
- `frontend/src/types/models.d.ts` (第64行)

## 执行步骤

### 1. 备份数据库（强烈建议）

```bash
pg_dump memoria_db > backup_before_drop_columns.sql
```

### 2. 运行删除脚本

```bash
cd backend-service-py
source .venv/bin/activate.fish
python drop_deprecated_columns.py
```

脚本会：
- 提示确认操作
- 删除 `content`, `recording_ids`, `media_ids` 列
- 验证删除结果

### 3. 验证数据库列

运行检查脚本确认删除成功：

```bash
python check_chapters_columns.py
```

### 4. 重启后端服务

```bash
python -m uvicorn app.main:app --reload --port 8999
```

### 5. 测试功能

- ✅ 章节列表查询
- ✅ 章节详情查询（包含 stories）
- ✅ 创建章节（使用新字段）
- ✅ 更新章节
- ✅ 前端展示（content 字段应该显示 introduction 内容）

## 回滚方案

如果需要回滚，可以使用备份恢复：

```bash
psql memoria_db < backup_before_drop_columns.sql
```

或者手动添加列：

```sql
ALTER TABLE chapters ADD COLUMN content TEXT;
ALTER TABLE chapters ADD COLUMN recording_ids TEXT;
ALTER TABLE chapters ADD COLUMN media_ids TEXT;
```

## 注意事项

1. **向后兼容**：
   - `ChapterResponse.content` 映射自 `introduction`
   - 旧代码仍然可以访问 `content` 字段

2. **数据迁移**：
   - 执行删除前确保已运行 `db_migrate_story.py` 和 `migrate_stories.py`
   - 确保 `content` 数据已迁移到 `introduction`

3. **不可逆操作**：
   - 列删除后数据无法恢复
   - 务必先备份数据库

## 相关文件

- 删除脚本：`drop_deprecated_columns.py`
- 检查脚本：`check_chapters_columns.py`
- 数据模型文档：`docs/architecture/data-model.md`
- 迁移脚本：`db_migrate_story.py`, `migrate_stories.py`
