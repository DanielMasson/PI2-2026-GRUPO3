import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DatabaseProvider } from './contexts/DatabaseContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PropriedadeProvider } from './contexts/PropriedadeContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import VerifyCode from './pages/VerifyCode'
import CreatePassword from './pages/CreatePassword'
import Dashboard from './pages/Dashboard'
import PropertyHome from './pages/PropertyHome'
import CadastroAnimal from './pages/AnimalRegistration'
import HealthModule from './pages/HealthModule'
import ListaAnimais from './pages/ListaAnimais'
import FichaAnimal from './pages/FichaAnimal'
import Reproducao from './pages/Reproducao'
import ArvoreGenealogica from './pages/ArvoreGenealogica'
import ProducaoLeite from './pages/ProducaoLeite'
import Configuracoes from './pages/Configuracoes'
import './styles/login_global.css'

function RotaPrivada({ children }) {
  const { autenticado } = useAuth()
  return autenticado ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas (autenticação) */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/verificar-codigo" element={<VerifyCode />} />
      <Route path="/criar-senha" element={<CreatePassword />} />

      {/* Rotas privadas */}
      <Route path="/dashboard" element={<RotaPrivada><Dashboard /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId" element={<RotaPrivada><PropertyHome /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<RotaPrivada><CadastroAnimal /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/animais" element={<RotaPrivada><ListaAnimais /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/animal/:animalId" element={<RotaPrivada><FichaAnimal /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/saude" element={<RotaPrivada><HealthModule /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/reproducao" element={<RotaPrivada><Reproducao /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/animal/:animalId/genealogia" element={<RotaPrivada><ArvoreGenealogica /></RotaPrivada>} />
      <Route path="/propriedade/:propriedadeId/producao-leite" element={<RotaPrivada><ProducaoLeite /></RotaPrivada>} />
      <Route path="/configuracoes" element={<RotaPrivada><Configuracoes /></RotaPrivada>} />

      {/* Redirecionamento padrão */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <PropriedadeProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </PropriedadeProvider>
      </AuthProvider>
    </DatabaseProvider>
  )
}

export default App
