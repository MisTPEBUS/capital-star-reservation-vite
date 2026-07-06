import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import AdminApp from './admin/AdminApp';
import { UpcomingReservationPage } from './pages/UpcomingReservationPage';
import { FaqPage } from './pages/FaqPage';
import { FrontendUIKitPage } from './pages/FrontendUIKitPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/ticket" element={<UpcomingReservationPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/ui-kit" element={<FrontendUIKitPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
