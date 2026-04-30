/**
 * 录音页
 *
 * 实时语音识别，实时显示转写文本
 */

import { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { useRealtimeASR } from './hooks/useRealtimeASR';
import styles from './index.module.scss';

export default function RecordingPage() {
  const [showEndModal, setShowEndModal] = useState(false);

  const {
    isConnected,
    isRecording,
    isPaused,
    currentTranscript,
    fullTranscript,
    duration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  } = useRealtimeASR({
    onError: (err) => {
      Taro.showToast({
        title: err.message,
        icon: 'none',
      });
    },
  });

  /**
   * 开始录音
   */
  const handleStart = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('启动录音失败', error);
    }
  };

  /**
   * 暂停/恢复录音
   */
  const handlePause = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  /**
   * 停止录音
   */
  const handleStop = async () => {
    await stopRecording();
    setShowEndModal(true);
  };

  /**
   * 保存录音
   */
  const handleSave = () => {
    // TODO: 保存到回忆录
    Taro.showToast({
      title: '保存成功',
      icon: 'success',
    });
    setShowEndModal(false);
    Taro.navigateBack();
  };

  /**
   * 放弃录音
   */
  const handleDiscard = () => {
    clearTranscript();
    setShowEndModal(false);
  };

  /**
   * 继续录音
   */
  const handleContinue = () => {
    setShowEndModal(false);
    startRecording();
  };

  /**
   * 格式化时长
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className={styles.recording}>
      {/* 顶部状态栏 */}
      <View className={styles.statusBar}>
        <View className={styles.statusLeft}>
          <View
            className={`${styles.statusDot} ${isRecording ? styles.recording : ''}`}
          />
          <Text className={styles.statusText}>
            {isRecording ? '正在录音' : isPaused ? '已暂停' : '未开始'}
          </Text>
        </View>
        <Text className={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      {/* 转写文本显示区 */}
      <ScrollView
        className={styles.transcriptArea}
        scrollY
        scrollIntoView="transcript-end"
      >
        {fullTranscript ? (
          <View className={styles.transcriptContent}>
            <Text className={styles.transcriptText}>{fullTranscript}</Text>
            {currentTranscript && (
              <Text className={`${styles.transcriptText} ${styles.current}`}>
                {currentTranscript}
              </Text>
            )}
          </View>
        ) : (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>
              {isRecording
                ? '正在识别您的语音...'
                : '点击下方按钮开始录音'}
            </Text>
          </View>
        )}
        <View id="transcript-end" />
      </ScrollView>

      {/* 错误提示 */}
      {error && (
        <View className={styles.errorBox}>
          <Text className={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 控制按钮 */}
      <View className={styles.controls}>
        {!isRecording && !isPaused ? (
          <Button
            variant="primary"
            size="lg"
            block
            onClick={handleStart}
          >
            开始录音
          </Button>
        ) : (
          <>
            <View className={styles.controlRow}>
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePause}
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={handleStop}
              >
                停止
              </Button>
            </View>
          </>
        )}
      </View>

      {/* 结束确认弹窗 */}
      <Modal
        visible={showEndModal}
        title="录音已完成"
        showCloseButton={false}
        footer={
          <View className={styles.modalFooter}>
            <Button
              variant="ghost"
              onClick={handleDiscard}
            >
              放弃
            </Button>
            <Button
              variant="secondary"
              onClick={handleContinue}
            >
              继续录音
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
            >
              保存
            </Button>
          </View>
        }
      >
        <View className={styles.modalContent}>
          <Text className={styles.modalText}>
            录音时长：{formatDuration(duration)}
          </Text>
          <Text className={styles.modalText}>
            转写字数：{fullTranscript.length} 字
          </Text>
          {fullTranscript && (
            <View className={styles.modalPreview}>
              <Text className={styles.previewText}>{fullTranscript}</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
