import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate(); // Hook para fazer a navegação pelo código

  const fazerLogin = () => {
    // Aqui no futuro entrará a validação de senha/banco de dados
    console.log("Login com sucesso!");
    // Navega o usuário para a tela de dashboard
    navigate('/dashboard'); 
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Bem-vindo ao App de Gestão</h1>
      <p>Insira suas credenciais!</p>
      
      {/* Botão de exemplo para testar a rota */}
      <button onClick={fazerLogin} style={{ padding: '10px 20px', fontSize: '18px' }}>
        Entrar
      </button>
    </div>
  );
}

export default Login;