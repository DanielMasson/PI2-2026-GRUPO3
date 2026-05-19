import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroAnimal from './pages/AnimalRegistration';
import PropertyHome from './pages/PropertyHome';
import './styles/login_global.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Página inicial da propriedade — nova rota */}
        <Route path="/propriedade/:propriedadeId" element={<PropertyHome />} />

        {/* Cadastro de animal */}
        <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<CadastroAnimal />} />

        {/* Futuras rotas */}
        {/* <Route path="/propriedade/:propriedadeId/lotes" element={<Lotes />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/tarefas" element={<Tarefas />} /> */}
      </Routes>
    </HashRouter>
  );
}

export default App;