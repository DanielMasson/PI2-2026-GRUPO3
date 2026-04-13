import React from 'react';
// IMPORTANTE: Importar o HashRouter em vez do BrowserRouter
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importando suas telas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Rota padrão: redireciona para o login se acessar a raiz */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Tela de Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Tela Principal (Dashboard) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Futuras telas entrarão aqui */}
        {/* <Route path="/cadastro-animal" element={<CadastroAnimal />} /> */}
      </Routes>
    </HashRouter>
  );
}

export default App;