
/**
 * 回忆录列表页
 *
 * 展示所有回忆录，支持筛选和搜索 (Amber Theme)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Input as TaroInput, ScrollView, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
// lucide-react 图标在小程序中不可见，改用文本符号
import { useMemoirStore } from '@/stores/memoir';
import { getMemoirList, deleteMemoir } from '@/services/memoir';
import Modal from '@/components/Modal';
import { cn } from '@/utils/cn';

export default function MemoirPage() {
  const {
    memoirs,
    isLoading,
    error,
    setMemoirs,
    setLoading,
    setError,
    removeMemoir,
  } = useMemoirStore();

  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadMemoirs = async () => {
    try {
      setLoading(true);
      const data = await getMemoirList({ page: 1, pageSize: 50 });
      setMemoirs(data.items);
    } catch (error) {
      console.error('加载失败', error);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    // 同步 TabBar 状态
    if (typeof (Taro.getCurrentInstance().page as any)?.getTabBar === 'function') {
      (Taro.getCurrentInstance().page as any).getTabBar()?.setData?.({
        selected: 1
      });
    }
    loadMemoirs();
  });

  const filteredMemoirs = memoirs.filter((memoir) =>
    memoir.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleViewDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/memoir-detail/index?id=${id}` });
  };

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/memoir-create/index' });
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    try {
      await deleteMemoir(selectedId);
      removeMemoir(selectedId);
      setShowDeleteModal(false);
      setSelectedId(null);
      Taro.showToast({ title: '删除成功', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  return (
    <View className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20">
      {/* Header */}
      <View className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-10 shadow-sm px-4 py-4 safe-area-inset-top">
        <View className="flex flex-row items-center justify-between mb-4">
          <View className="flex flex-row items-center gap-3">
            <Text className="text-2xl font-bold text-amber-900">我的回忆录</Text>
          </View>
          <View
            className="px-4 py-2 bg-amber-600 rounded-lg active:bg-amber-700 transition-colors"
            onClick={handleCreate}
          >
            <Text className="text-base text-white font-medium">新建</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="relative w-full">
          <TaroInput
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            placeholder="搜索我的回忆录..."
            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-lg h-12 shadow-sm text-gray-800 focus:border-amber-400 transition-all"
            placeholderClass="text-gray-400"
          />
        </View>
      </View>

      <ScrollView scrollY className="flex-1">
        <View className="px-4 py-6">
          {isLoading ? (
            <View className="flex items-center justify-center py-20">
              <Text className="text-amber-600">加载中...</Text>
            </View>
          ) : filteredMemoirs.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20 text-center">
              <Text className="text-xl text-amber-800 mb-4 font-medium">
                {searchText ? '未找到相关回忆录' : '还没有回忆录'}
              </Text>
              {!searchText && (
                <View
                  className="mt-6 px-8 py-4 bg-amber-600 rounded-xl active:bg-amber-700"
                  onClick={handleCreate}
                >
                  <Text className="text-white font-medium text-lg">创建第一个回忆录</Text>
                </View>
              )}
            </View>
          ) : (
            <View className="pb-8 space-y-4">
              {filteredMemoirs.map((memoir) => (
                <View
                  key={memoir.id}
                  className="bg-white rounded-xl border border-amber-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.99] transition-transform"
                  onClick={() => handleViewDetail(memoir.id)}
                >
                  <View className="flex flex-row p-4 gap-4">
                    {/* Thumbnail / Cover */}
                    <View className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-amber-50 border border-amber-100 relative">
                      {memoir.coverImage ? (
                        <Image
                          src={memoir.coverImage}
                          mode="aspectFill"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <View className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                          <Text className="text-sm text-amber-600 font-medium">回忆录</Text>
                        </View>
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1 flex flex-col justify-between">
                      <View>
                        <Text className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                          {memoir.title}
                        </Text>
                        <Text className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {memoir.description || '暂无描述'}
                        </Text>
                      </View>

                      <View className="flex flex-row items-center justify-between mt-2">
                        <Text className="text-sm text-amber-600/80">
                          {new Date(memoir.createdAt).toLocaleDateString()}
                        </Text>

                        {/* Actions */}
                        <View className="flex flex-row gap-2">
                          <View
                            className="px-3 py-1 bg-red-50 rounded active:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(memoir.id);
                              setShowDeleteModal(true);
                            }}
                          >
                            <Text className="text-sm text-red-500">删除</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation */}
      <Modal
        visible={showDeleteModal}
        title="确认删除"
        showCloseButton={false}
        footer={
          <View className="flex flex-row justify-end gap-4 pt-2">
            <View
              className="px-4 py-2 rounded-lg bg-gray-100 active:bg-gray-200"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedId(null);
              }}
            >
              <Text className="text-gray-600">取消</Text>
            </View>
            <View
              className="px-4 py-2 rounded-lg bg-red-500 active:bg-red-600"
              onClick={handleDeleteConfirm}
            >
              <Text className="text-white">删除</Text>
            </View>
          </View>
        }
      >
        <Text className="text-gray-600 text-base py-4">确定要删除这个回忆录吗？删除后无法恢复。</Text>
      </Modal>
    </View>
  );
}
