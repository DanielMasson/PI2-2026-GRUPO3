import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import CreatePassword from './pages/CreatePassword';
import Dashboard from './pages/Dashboard';
import PropertyHome from './pages/PropertyHome';
import CadastroAnimal from './pages/AnimalRegistration';
import HealthModule from './pages/HealthModule';
import './styles/login_global.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Rotas públicas (autenticação) */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/verificar-codigo" element={<VerifyCode />} />
        <Route path="/criar-senha" element={<CreatePassword />} />

        {/* Rotas privadas */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/propriedade/:propriedadeId" element={<PropertyHome />} />
        <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<CadastroAnimal />} />
        <Route path="/propriedade/:propriedadeId/saude" element={<HealthModule />} />

        {/* Futuras rotas */}
        {/* <Route path="/propriedade/:propriedadeId/lotes" element={<Lotes />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/tarefas" element={<Tarefas />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/reproducao" element={<Reproducao />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/financeiro" element={<Financeiro />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/animais" element={<ListaAnimais />} /> */}
        {/* <Route path="/propriedade/:propriedadeId/animal/:animalId" element={<FichaAnimal />} /> */}
        {/* <Route path="/configuracoes" element={<Configuracoes />} /> */}
        {/* <Route path="/perfil" element={<Perfil />} /> */}

        {/* Redirecionamento padrão */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
