import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SecurityDashboard from './pages/SecurityDashboard';

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/" element={<Navigate to="/security" replace />} />
            <Route path="*" element={<Navigate to="/security" replace />} />
        </Routes>
    </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
