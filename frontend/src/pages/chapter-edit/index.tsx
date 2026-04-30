/**
 * 章节编辑页
 *
 * 创建或编辑章节内容
 */

import { useEffect, useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import {
  getChapterDetail,
  createChapter,
  updateChapter,
} from '@/services/memoir';
import Button from '@/components/Button';
import styles from './index.module.scss';

export default function ChapterEditPage() {
  const router = useRouter();
  const action = router.params.action || 'create';
  const chapterId = router.params.id;
  const memoirId = router.params.memoirId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 加载章节详情
   */
  const loadChapterDetail = async () => {
    if (action !== 'edit' || !chapterId) return;

    try {
      setIsLoading(true);
      const data = await getChapterDetail(chapterId);
      setTitle(data.title);
      setContent(data.content);
    } catch (error) {
      console.error('加载失败', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存章节
   */
  const handleSave = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入章节标题',
        icon: 'none',
      });
      return;
    }

    if (!content.trim()) {
      Taro.showToast({
        title: '请输入章节内容',
        icon: 'none',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (action === 'create') {
        await createChapter({
          memoirId: Number(memoirId),
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await updateChapter({
          id: Number(chapterId),
          title: title.trim(),
          content: content.trim(),
        });
      }

      Taro.showToast({
        title: '保存成功',
        icon: 'success',
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 500);
    } catch (error) {
      console.error('保存失败', error);
      Taro.showToast({
        title: '保存失败',
        icon: 'none',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 生成 AI 内容
   */
  const handleGenerateAI = () => {
    Taro.showToast({
      title: 'AI 生成功能开发中',
      icon: 'none',
    });
  };

  /**
   * 取消编辑
   */
  const handleCancel = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要放弃修改吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack();
        }
      },
    });
  };

  /**
   * 初始化
   */
  useEffect(() => {
    loadChapterDetail();
  }, [action, chapterId]);

  if (isLoading) {
    return (
      <View className={styles.loading}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View className={styles.chapterEdit}>
      {/* 标题输入 */}
      <View className={styles.formGroup}>
        <Text className={styles.label}>章节标题</Text>
        <Textarea
          className={styles.titleInput}
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
          placeholder="请输入章节标题"
          maxlength={50}
          autoHeight
        />
      </View>

      {/* 内容输入 */}
      <View className={styles.formGroup}>
        <View className={styles.labelRow}>
          <Text className={styles.label}>章节内容</Text>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAI}
          >
            AI 生成
          </Button>
        </View>
        <Textarea
          className={styles.contentInput}
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          placeholder="请输入章节内容，或使用 AI 生成"
          maxlength={10000}
          autoHeight
        />
      </View>

      {/* 字数统计 */}
      <View className={styles.wordCount}>
        <Text className={styles.wordCountText}>
          {content.length} / 10000 字
        </Text>
      </View>

      {/* 操作按钮 */}
      <View className={styles.actions}>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleCancel}
        >
          取消
        </Button>
        <Button
          variant="primary"
          size="lg"
          loading={isSaving}
          onClick={handleSave}
        >
          保存
        </Button>
      </View>
    </View>
  );
}
