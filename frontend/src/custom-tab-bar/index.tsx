import { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

const TABS = [
  {
    pagePath: 'pages/home/index',
    text: '首页',
    iconPath: require('../assets/icons/home-v2.png'),
    selectedIconPath: require('../assets/icons/home-active-v2.png'),
  },
  {
    pagePath: 'pages/memoir/index',
    text: '回忆录',
    iconPath: require('../assets/icons/memoir-v2.png'),
    selectedIconPath: require('../assets/icons/memoir-active-v2.png'),
  },
  {
    pagePath: 'pages/profile/index',
    text: '我的',
    iconPath: require('../assets/icons/profile-v2.png'),
    selectedIconPath: require('../assets/icons/profile-active-v2.png'),
  },
];

const normalizePath = (rawPath?: string) => {
  if (!rawPath) {
    return '';
  }
  let path = rawPath.trim();
  if (path.startsWith('#')) {
    path = path.slice(1);
  }
  path = path.split('?')[0].split('#')[0];
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return path;
};

const findTabIndex = (rawPath?: string) => {
  const path = normalizePath(rawPath);
  if (!path) {
    return -1;
  }
  return TABS.findIndex((tab) => path === tab.pagePath || path.endsWith(tab.pagePath));
};

const getSelectedIndex = (isWeb: boolean) => {
  const pages = Taro.getCurrentPages?.() ?? [];
  const currentPage = pages[pages.length - 1] as {
    route?: string;
    path?: string;
    $taroPath?: string;
  } | undefined;
  const pagePath = currentPage?.route || currentPage?.path || currentPage?.$taroPath;
  let index = findTabIndex(pagePath);
  if (index !== -1) {
    return index;
  }
  if (isWeb && typeof window !== 'undefined' && window.location) {
    index = findTabIndex(window.location.hash);
    if (index !== -1) {
      return index;
    }
    return findTabIndex(window.location.pathname);
  }
  return -1;
};

export default function CustomTabBar() {
  const isWeb = Taro.getEnv() === Taro.ENV_TYPE.WEB;
  const [selected, setSelected] = useState(() => getSelectedIndex(isWeb));

  useEffect(() => {
    const updateSelected = () => {
      setSelected(getSelectedIndex(isWeb));
    };

    updateSelected();

    Taro.eventCenter?.on?.('__taroRouterChange', updateSelected);
    if (isWeb && typeof window !== 'undefined') {
      window.addEventListener('hashchange', updateSelected);
      window.addEventListener('popstate', updateSelected);
    }

    return () => {
      Taro.eventCenter?.off?.('__taroRouterChange', updateSelected);
      if (isWeb && typeof window !== 'undefined') {
        window.removeEventListener('hashchange', updateSelected);
        window.removeEventListener('popstate', updateSelected);
      }
    };
  }, [isWeb]);

  if (isWeb && selected === -1) {
    return null;
  }

  const activeIndex = selected === -1 ? 0 : selected;
  const rootClassName = isWeb ? 'custom-tab-bar custom-tab-bar--fixed' : 'custom-tab-bar';

  return (
    <View className={rootClassName}>
      {TABS.map((tab, index) => {
        const isActive = activeIndex === index;
        return (
          <View
            key={tab.pagePath}
            className="custom-tab-bar__item"
            onClick={() => Taro.switchTab({ url: `/${tab.pagePath}` })}
          >
            <Image
              src={isActive ? tab.selectedIconPath : tab.iconPath}
              className="custom-tab-bar__icon"
            />
            <Text
              className={
                isActive ? 'custom-tab-bar__text custom-tab-bar__text--active' : 'custom-tab-bar__text'
              }
            >
              {tab.text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
