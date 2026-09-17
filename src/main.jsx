import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import App from './App';
import '../styles.css';

const ThemeContext = createContext(null);

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within ThemeProvider.');
  return context;
}

function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('omnichannel-theme') || 'dark');
  const isDark = mode === 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem('omnichannel-theme', mode);
  }, [mode]);

  const appTheme = useMemo(() => ({
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#0c82c9',
      colorInfo: '#0c82c9',
      colorLink: '#0c82c9',
      colorBgBase: isDark ? '#07111f' : '#f5f7fb',
      colorBgContainer: isDark ? '#0d1a2e' : '#ffffff',
      colorBgLayout: isDark ? '#07111f' : '#f5f7fb',
      colorTextBase: isDark ? '#f4f7fb' : '#172033',
      borderRadius: 12,
      fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
      fontWeightStrong: 700,
      controlHeight: 38,
      boxShadow: isDark
        ? '0 8px 24px -8px rgba(0, 0, 0, 0.5)'
        : '0 8px 24px -8px rgba(23, 32, 51, 0.12)'
    },
    components: {
      Layout: { siderBg: isDark ? '#0a1526' : '#ffffff', headerBg: isDark ? '#0a1526' : '#ffffff' },
      Menu: { itemBg: 'transparent', darkItemBg: 'transparent', itemHeight: 42, fontWeightStrong: 700 },
      Button: { fontWeight: 600, primaryShadow: 'none' },
      Card: { fontWeightStrong: 700 },
      Statistic: { fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif" },
      Typography: { fontWeightStrong: 800 }
    }
  }), [isDark]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme: () => setMode(isDark ? 'light' : 'dark') }}>
      <ConfigProvider theme={appTheme}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AntApp>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </AntApp>
    </ThemeProvider>
  </React.StrictMode>
);
