import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// Isso aqui resolve o problema de caminhos no Linux/Windows de forma automática
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // 1. Define que os arquivos usarão caminhos relativos (./) 
  // Essencial para o Cordova abrir o index.html corretamente
  base: './', 
  
  build: {
    // 2. Aqui é onde a mágica acontece: 
    // Dizemos para o Vite sair de 'src-react' e entrar em 'www'
    outDir: path.resolve(__dirname, '../www'),
    
    // 3. Limpa a pasta www antes de colocar os arquivos novos
    emptyOutDir: true, 
  }
})