import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroAnimal from './pages/AnimalRegistration';
import './styles/login_global.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Placeholder: futuramente haverá uma tela de detalhes da propriedade antes */}
        <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<CadastroAnimal />} />

        {/* Futuras rotas */}
        {/* <Route path="/propriedade/:propriedadeId" element={<DetalhePropriedade />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/animais" element={<ListaAnimais />} /> */}
      </Routes>
    </HashRouter>
  );
}

export default App;
