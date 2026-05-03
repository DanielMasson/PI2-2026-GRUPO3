import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode     from './pages/VerifyCode';
import CreatePassword from './pages/CreatePassword';

import './styles/login_global.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"                element={<Navigate to="/login" />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/cadastro"        element={<Register />} />
        <Route path="/esqueci-senha"   element={<ForgotPassword />} />
        <Route path="/verificar-codigo" element={<VerifyCode />} />
        <Route path="/criar-senha"     element={<CreatePassword />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
