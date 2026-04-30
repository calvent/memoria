/**
 * Taro 应用入口
 */

import './styles/globals.css';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

let H5TabBar: typeof import('./custom-tab-bar').default | null = null;
if (process.env.TARO_ENV === 'h5') {
  H5TabBar = require('./custom-tab-bar').default;
}

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  return (
    <>
      {children}
      {H5TabBar ? <H5TabBar /> : null}
    </>
  );
}

export default App;
