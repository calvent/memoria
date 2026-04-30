// 用户类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

// 回忆类型
export interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  location?: string;
  imageUrl?: string;
  createdAt: number;
  chapterId: string; // 所属章节
}

// 章节类型
export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number; // 章节顺序
  createdAt: number;
}

// 回忆录类型
export interface Memoir {
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean; // 是否公开到广场
  createdAt: number;
  updatedAt: number;
}

// 广场上展示的回忆录（包含作者信息）
export interface PublicMemoir extends Memoir {
  author: User;
  chapterCount: number;
  memoryCount: number;
}
