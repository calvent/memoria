/**
 * 个人中心页
 *
 * 用户信息、设置等
 */

import React, { useState } from 'react';
import { View, Text, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useAuthStore } from '@/stores/auth';
import { IS_DEV } from '@/config/env';
import { post } from '@/services/request';

// 测试用户列表
const TEST_USERS = [
  { phone: '13800138001', name: '张天明', desc: '工厂工人 - 3个章节' },
  { phone: '13800138002', name: '李秀芳', desc: '乡村教师 - 5个章节' },
  { phone: '13800138003', name: '王建国', desc: '内科医生 - 7个章节' },
  { phone: '13800138004', name: '刘和平', desc: '钢铁工人 - 4个章节' },
];

export default function ProfilePage() {
  const { user, token, setTokens, logout } = useAuthStore();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentUserName, setCurrentUserName] = useState('');

  // 同步 TabBar 状态
  useDidShow(() => {
    if (typeof (Taro.getCurrentInstance().page as any)?.getTabBar === 'function') {
      (Taro.getCurrentInstance().page as any).getTabBar()?.setData?.({
        selected: 2
      });
    }

    // 尝试从localStorage获取当前用户信息
    const savedUserName = Taro.getStorageSync('currentUserName');
    if (savedUserName) {
      setCurrentUserName(savedUserName);
    }
  });

  /**
   * 切换测试用户
   */
  const handleSwitchUser = async (e: any) => {
    const index = parseInt(e.detail.value);
    const selectedUser = TEST_USERS[index];

    try {
      Taro.showLoading({ title: '切换中...' });

      // 调用手机号登录API
      const response = await post('/api/v1/auth/phone_login', {
        phone: selectedUser.phone
      });

      // 更新token
      setTokens(response.token, response.refreshToken);

      // 保存用户名
      Taro.setStorageSync('currentUserName', selectedUser.name);

      setCurrentUserIndex(index);
      setCurrentUserName(selectedUser.name);

      Taro.hideLoading();
      Taro.showToast({
        title: `已切换到${selectedUser.name}`,
        icon: 'success'
      });

      // 刷新页面
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/profile/index' });
      }, 1000);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '切换失败',
        icon: 'none'
      });
      console.error('切换用户失败:', error);
    }
  };

  /**
   * 退出登录
   */
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.removeStorageSync('currentUserName');
          Taro.reLaunch({ url: '/pages/home/index' });
        }
      },
    });
  };

  /**
   * 菜单项点击
   */
  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'memoir':
        Taro.switchTab({ url: '/pages/memoir/index' });
        break;
      case 'settings':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'about':
        Taro.showToast({ title: '功能开发中', icon: 'none' });
        break;
      default:
        break;
    }
  };

  const isLoggedIn = !!token;

  return (
    <View className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* 用户信息卡片 */}
      <View className="bg-white/80 backdrop-blur-sm mx-4 mt-6 rounded-2xl p-6 shadow-sm border border-blue-100">
        <View className="flex flex-row items-center gap-4">
          {/* 头像 */}
          <View className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Text className="text-3xl text-white">👤</Text>
          </View>
          {/* 用户信息 */}
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {isLoggedIn ? (currentUserName || `用户 ${user?.id || ''}`) : '未登录'}
            </Text>
            <Text className="text-sm text-gray-500">
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </Text>
          </View>
        </View>
      </View>

      {/* 开发环境用户切换 */}
      {IS_DEV && (
        <View className="mx-4 mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <View className="flex flex-row items-center gap-2 mb-3">
            <Text className="text-xl">👥</Text>
            <Text className="text-base font-bold text-amber-900">
              开发模式 - 切换测试用户
            </Text>
          </View>

          <Picker
            mode="selector"
            range={TEST_USERS.map(u => `${u.name} (${u.desc})`)}
            value={currentUserIndex}
            onChange={handleSwitchUser}
          >
            <View className="bg-white border-2 border-amber-300 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">
                  {TEST_USERS[currentUserIndex].name}
                </Text>
                <Text className="text-sm text-gray-500">
                  {TEST_USERS[currentUserIndex].desc}
                </Text>
              </View>
              <Text className="text-2xl text-amber-600">›</Text>
            </View>
          </Picker>

          <Text className="text-xs text-amber-700 mt-2 leading-relaxed">
            💡 提示：切换用户后会自动重新登录，可以查看不同用户的回忆录数据
          </Text>
        </View>
      )}

      {/* 菜单列表 */}
      <View className="mx-4 mt-6 bg-white rounded-2xl overflow-hidden shadow-sm border border-blue-100">
        <View
          className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100 active:bg-gray-50"
          onClick={() => handleMenuClick('memoir')}
        >
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Text className="text-xl">📚</Text>
            </View>
            <Text className="text-base text-gray-900">我的回忆录</Text>
          </View>
          <Text className="text-2xl text-gray-400">›</Text>
        </View>

        <View
          className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100 active:bg-gray-50"
          onClick={() => handleMenuClick('settings')}
        >
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Text className="text-xl">⚙️</Text>
            </View>
            <Text className="text-base text-gray-900">设置</Text>
          </View>
          <Text className="text-2xl text-gray-400">›</Text>
        </View>

        <View
          className="flex flex-row items-center justify-between px-6 py-4 active:bg-gray-50"
          onClick={() => handleMenuClick('about')}
        >
          <View className="flex flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Text className="text-xl">ℹ️</Text>
            </View>
            <Text className="text-base text-gray-900">关于</Text>
          </View>
          <Text className="text-2xl text-gray-400">›</Text>
        </View>
      </View>

      {/* 退出登录 */}
      <View className="mx-4 mt-6">
        <View
          className="bg-white border-2 border-red-200 rounded-2xl px-6 py-4 flex flex-row items-center justify-center gap-3 active:bg-red-50 shadow-sm"
          onClick={handleLogout}
        >
          <Text className="text-xl">🚪</Text>
          <Text className="text-base font-medium text-red-600">退出登录</Text>
        </View>
      </View>

      {/* 版本信息 */}
      <View className="mt-8 px-4">
        <Text className="text-center text-sm text-gray-400">
          回忆录小程序 v1.0.0
        </Text>
        {IS_DEV && (
          <Text className="text-center text-xs text-amber-600 mt-1">
            Development Mode
          </Text>
        )}
      </View>
    </View>
  );
}
