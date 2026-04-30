/**
 * 首页 - 广场 (Plaza/Square)
 *
 * 展示公开的回忆录列表
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Input as TaroInput, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { Search, TrendingUp, Clock, BookOpen, PlusCircle } from 'lucide-react';
import { MemoirCard } from '@/components/Plaza/MemoirCard';
import { SAMPLE_PUBLIC_MEMOIRS } from '@/constants/plaza';
import { PlazaMemoir } from '@/types/models';
import { cn } from '@/utils/cn';
import { getPublicMemoirs } from '@/services/memoir';

type SortType = "latest" | "popular";

export default function SquarePage() {
  // 同步 TabBar 状态
  useDidShow(() => {
    if (typeof (Taro.getCurrentInstance().page as any)?.getTabBar === 'function') {
      (Taro.getCurrentInstance().page as any).getTabBar()?.setData?.({
        selected: 0
      });
    }
    // 页面显示时加载数据
    loadMemoirs();
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [memoirs, setMemoirs] = useState<PlazaMemoir[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载回忆录数据
  const loadMemoirs = async () => {
    try {
      setIsLoading(true);
      const data = await getPublicMemoirs({ page: 1, pageSize: 50 });

      // 转换为PlazaMemoir格式
      const plazaMemoirs: PlazaMemoir[] = data.items.map((item: any) => ({
        id: String(item.id),
        userId: String(item.userId),
        elderId: String(item.elderId || item.userId),
        status: item.status,
        title: item.title,
        description: item.description || '',
        coverImage: item.coverImage || '',
        isPublic: true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        author: {
          id: String(item.userId),
          // 优先显示昵称，没有则显示真名
          name: item.elderNickname || item.elderName || '未知作者',
          bio: item.description?.substring(0, 20) || '',
        },
        chapterCount: item.chapterCount || 0,
        memoryCount: item.chapterCount * 4 || 0,  // 估算值
      }));

      setMemoirs(plazaMemoirs);
    } catch (error) {
      console.error('加载回忆录失败:', error);
      // 加载失败时使用mock数据作为后备
      setMemoirs(SAMPLE_PUBLIC_MEMOIRS);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤和排序
  const filteredMemoirs = memoirs
    .filter(
      (memoir) =>
        memoir.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // @ts-ignore - description might be undefined in strict types but present in data
        (memoir.description && memoir.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        memoir.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();

      if (sortType === "latest") {
        return timeB - timeA;
      } else {
        // 按回忆数量排序
        return b.memoryCount - a.memoryCount;
      }
    });

  const handleViewMemoir = (memoir: PlazaMemoir) => {
    // 从广场点击，传递public=true参数
    Taro.navigateTo({ url: `/pages/memoir-detail/index?id=${memoir.id}&public=true` });
  };

  const handleStartRecording = () => {
    Taro.navigateTo({ url: '/pages/recording/index' });
  };

  return (
    <View className="h-screen flex flex-col bg-slate-50">
      {/* 头部 Header - 固定在顶部，紧凑布局 */}
      <View className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-4 safe-area-inset-top pb-3">
        {/* 第一行：标题与操作 */}
        <View className="flex flex-row items-center justify-between h-11 mb-1">
          <View className="flex flex-row items-center gap-2">
            <BookOpen size={20} color="#1e40af" /> {/* blue-800 */}
            <Text className="text-lg font-bold text-slate-900 tracking-tight">
              回忆录广场
            </Text>
          </View>

          {/* Create Button */}
          <View
            className="flex flex-col items-center justify-center p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
            onClick={handleStartRecording}
          >
            <PlusCircle size={22} color="#2563eb" />
          </View>
        </View>

        {/* 第二行：搜索框 - 紧凑设计 */}
        <View className="relative flex flex-row items-center h-9 bg-slate-100/80 rounded-full px-3 transition-colors">
          <View className="mr-2 opacity-50">
            <Search size={16} color="#475569" />
          </View>

          <TaroInput
            value={searchTerm}
            onInput={(e) => setSearchTerm(e.detail.value)}
            placeholder="搜索回忆录..."
            placeholderClass="text-slate-400 text-sm"
            className="flex-1 h-full bg-transparent text-sm text-slate-800"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              height: '100%',
              minHeight: '100%'
            }}
          />
        </View>
      </View>

      <ScrollView
        scrollY
        className="flex-1"
        style={{
          paddingTop: '100px' // 预留给Header的空间 (44px status bar assumed + 44px title + 36px search + spacers)
          // 实际上 safe-area-top 会占据额外空间，padding-top 应该是 header 内容高度。
          // Header 内容高度约: 44px (row1) + 4px (mb) + 36px (row2) + 12px (pb) = 96px.
          // 我们设置稍多一点 110px 安全。
        }}
        scrollWithAnimation={true}
      >
        <View className="px-4 py-6">
          {/* 排序选项 Tabs */}
          <View className="flex flex-row items-center justify-between mb-6">
            <View className="flex flex-row bg-white rounded-lg p-1 border border-blue-100 shadow-sm">
              <View
                className={cn(
                  "flex flex-row items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  sortType === "latest" ? "bg-blue-50" : "bg-transparent"
                )}
                onClick={() => setSortType("latest")}
              >
                <Clock size={16} color={sortType === "latest" ? "#1e40af" : "#6b7280"} />
                <Text className={cn("text-sm font-medium", sortType === "latest" ? "text-blue-800" : "text-gray-500")}>
                  最新更新
                </Text>
              </View>
              <View
                className={cn(
                  "flex flex-row items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  sortType === "popular" ? "bg-blue-50" : "bg-transparent"
                )}
                onClick={() => setSortType("popular")}
              >
                <TrendingUp size={16} color={sortType === "popular" ? "#1e40af" : "#6b7280"} />
                <Text className={cn("text-sm font-medium", sortType === "popular" ? "text-blue-800" : "text-gray-500")}>
                  最受欢迎
                </Text>
              </View>
            </View>

            <Text className="text-base text-blue-800">
              共 <Text className="font-bold text-lg">{filteredMemoirs.length}</Text> 部
            </Text>
          </View>

          {/* 回忆录列表 List */}
          {filteredMemoirs.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <BookOpen size={64} color="#60a5fa" className="mb-4" /> {/* blue-400 */}
              <Text className="text-xl text-blue-700 mb-2 font-medium">
                {searchTerm ? "没有找到匹配的回忆录" : "广场上还没有公开的回忆录"}
              </Text>
              <Text className="text-base text-blue-500 text-center px-8">
                {searchTerm
                  ? "试试其他搜索关键词"
                  : "快去创建并分享你的回忆录吧"}
              </Text>
            </View>
          ) : (
            <View className="pb-8">
              {filteredMemoirs.map((memoir) => (
                <MemoirCard
                  key={memoir.id}
                  memoir={memoir}
                  onClick={handleViewMemoir}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
