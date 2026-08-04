import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import App from './App';
import '../styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#4cc9f0',
          colorInfo: '#4cc9f0',
          colorLink: '#4cc9f0',
          colorBgBase: '#07111f',
          colorBgContainer: '#0d1a2e',
          colorBgLayout: '#07111f',
          borderRadius: 10,
          fontFamily: "Inter, 'Segoe UI', Roboto, Arial, sans-serif"
        },
        components: {
          Layout: { siderBg: '#0a1526', headerBg: '#0a1526' },
          Menu: { itemBg: 'transparent', darkItemBg: 'transparent' }
        }
      }}
    >
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
