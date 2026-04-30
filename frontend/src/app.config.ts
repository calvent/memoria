/**
 * Taro 应用配置
 */

const isWeapp = process.env.TARO_ENV === 'weapp';

export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/home/index',
    'pages/recording/index',
    'pages/memoir/index',
    'pages/memoir-detail/index',
    'pages/chapter-detail/index',
    'pages/profile/index',
    'pages/chapter-edit/index',
    'pages/memoir-create/index',
  ],

  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fafaf9',
    navigationBarTitleText: 'AI 老年回忆录',
    navigationBarTextStyle: 'black',
  },

  // 权限说明配置
  permission: {
    'scope.record': {
      desc: '需要使用您的麦克风进行语音录制，用于创建回忆录内容',
    },
  },

  tabBar: {
    custom: isWeapp,
    color: '#6b7280',
    selectedColor: '#d97706',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/icons/home-v2.png',
        selectedIconPath: 'assets/icons/home-active-v2.png',
      },
      {
        pagePath: 'pages/memoir/index',
        text: '回忆录',
        iconPath: 'assets/icons/memoir-v2.png',
        selectedIconPath: 'assets/icons/memoir-active-v2.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile-v2.png',
        selectedIconPath: 'assets/icons/profile-active-v2.png',
      },
    ],
  },
});
