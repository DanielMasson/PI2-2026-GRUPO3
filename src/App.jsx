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
import ReproducaoCio from './pages/Reproducao/Cio'
import ReproducaoCobertura from './pages/Reproducao/Cobertura'
import ReproducaoPrenhez from './pages/Reproducao/Prenhez'
import ReproducaoParto from './pages/Reproducao/Parto'
import ArvoreGenealogica from './pages/ArvoreGenealogica'
import ProducaoLeite from './pages/ProducaoLeite'
import Configuracoes from './pages/Configuracoes'
import SyncIndicator from './components/SyncIndicator'
import './styles/login_global.css'

// Gate de autenticação que também monta o SyncIndicator globalmente em
// todas as rotas privadas. Renderiza children + badge fixo top-right.
function RotaPrivadaComShell({ children }) {
  const { autenticado } = useAuth()
  if (!autenticado) return <Navigate to="/login" />
  return (
    <>
      {children}
      <SyncIndicator />
    </>
  )
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
      <Route path="/dashboard" element={<RotaPrivadaComShell><Dashboard /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId" element={<RotaPrivadaComShell><PropertyHome /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/cadastro-animal" element={<RotaPrivadaComShell><CadastroAnimal /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/animais" element={<RotaPrivadaComShell><ListaAnimais /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/animal/:animalId" element={<RotaPrivadaComShell><FichaAnimal /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/saude" element={<RotaPrivadaComShell><HealthModule /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/reproducao" element={<RotaPrivadaComShell><Reproducao /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/reproducao/cio" element={<RotaPrivadaComShell><ReproducaoCio /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/reproducao/cobertura" element={<RotaPrivadaComShell><ReproducaoCobertura /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/reproducao/prenhez" element={<RotaPrivadaComShell><ReproducaoPrenhez /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/reproducao/parto" element={<RotaPrivadaComShell><ReproducaoParto /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/animal/:animalId/genealogia" element={<RotaPrivadaComShell><ArvoreGenealogica /></RotaPrivadaComShell>} />
      <Route path="/propriedade/:propriedadeId/producao-leite" element={<RotaPrivadaComShell><ProducaoLeite /></RotaPrivadaComShell>} />
      <Route path="/configuracoes" element={<RotaPrivadaComShell><Configuracoes /></RotaPrivadaComShell>} />

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
