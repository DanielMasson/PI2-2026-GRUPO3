import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const fazerLogout = () => {
    // Navega de volta para o login
    navigate('/login'); 
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Principal</h1>
      <p>Aqui ficarão os gráficos de Ganho Médio Diário e a listagem de animais.</p>
      
      <button onClick={fazerLogout}>Sair</button>
    </div>
  );
}

export default Dashboard;