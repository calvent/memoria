import path from 'path';

const outputRoot = process.env.TARO_ENV === 'h5' ? 'dist-h5' : 'dist';

const config = {
  projectName: 'memoria-frontend',
  date: '2024-1-10',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot,
  plugins: [
    '@tarojs/plugin-html'
  ],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false
    }
  },
  cache: {
    enable: false
  },
  sass: {
    data: `@use "@/styles/variables.scss" as *;`
  },
  mini: {
    webpackChain(chain: any) {
      // 集成 weapp-tailwindcss 以支持 Tailwind CSS 在小程序中使用
      const { UnifiedWebpackPluginV5 } = require('weapp-tailwindcss/webpack');
      chain.plugin('weapp-tailwindcss').use(UnifiedWebpackPluginV5, [
        {
          appType: 'taro',
          framework: 'react',
        },
      ]);
    },
    addChunkPages(pages: Map<string, string[]>) {
      pages.set('custom-tab-bar/index', ['runtime', 'taro', 'vendors', 'common']);
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true
      },
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  }
};

export default config;
