import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyCode     from './pages/VerifyCode'
import CreatePassword from './pages/CreatePassword'
import Dashboard      from './pages/Dashboard'
import PropertyHome   from './pages/PropertyHome'
import CadastroAnimal from './pages/AnimalRegistration'
import HealthModule        from './pages/HealthModule'
import AnimalHealthProfile from './pages/AnimalHealthProfile'

import './styles/login_global.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"       element={<Navigate to="/login" />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/cadastro"         element={<Register />} />
        <Route path="/esqueci-senha"    element={<ForgotPassword />} />
        <Route path="/verificar-codigo" element={<VerifyCode />} />
        <Route path="/criar-senha"      element={<CreatePassword />} />
        <Route path="/dashboard"        element={<Dashboard />} />

        {/* Página inicial da propriedade */}
        <Route path="/propriedade/:propriedadeId" element={<PropertyHome />} />

        {/* Cadastro de animal */}
        <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<CadastroAnimal />} />

        {/* Módulo sanitário — visão geral (lista de animais com status) */}
        <Route path="/propriedade/:propriedadeId/saude" element={<HealthModule />} />

        {/* Perfil sanitário individual do animal */}
        <Route path="/propriedade/:propriedadeId/saude/:animalId" element={<AnimalHealthProfile />} />
      </Routes>
    </HashRouter>
  )
}

export default App
