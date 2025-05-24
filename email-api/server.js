
require('dotenv').config(); // Deve ser a primeira linha
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const emailRoutes = require('./routes/emailRoutes');

console.log("[email-api server.js] Script iniciado...");

// Diagnóstico de variáveis de ambiente
const requiredEnvVars = ['PORT', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'JWT_SECRET', 'CLIENT_URL'];
let missingVars = [];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.error(`[email-api server.js] ERRO FATAL: O SERVIDOR NÃO PODE INICIAR!`);
  console.error(`As seguintes variáveis de ambiente obrigatórias não estão definidas no arquivo email-api/.env: ${missingVars.join(', ')}`);
  console.error("Por favor, configure essas variáveis e tente novamente.");
  console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  process.exit(1); // Impede o servidor de iniciar se variáveis críticas estiverem faltando
}

console.log("[email-api server.js] Diagnóstico do .env (as variáveis obrigatórias estão presentes):");
console.log(`  PORT: ${process.env.PORT}`);
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER}`);
console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? 'Definido (não será exibido)' : 'NÃO DEFINIDO!'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? 'Definido (não será exibido)' : 'NÃO DEFINIDO!'}`);
console.log(`  CLIENT_URL: ${process.env.CLIENT_URL}`);
console.log("----------------------------------------------------");


const app = express();

console.log("EMAIL-API: Aplicando configuração CORS para permitir todas as origens.");
app.use(cors()); // Permite todas as origens

app.use(bodyParser.json());

console.log("[email-api server.js] Configurando rotas de e-mail em /api/email");
app.use('/api/email', emailRoutes);

// Manipulador de erro global - deve ser o último middleware
app.use((err, req, res, next) => {
  console.error('[email-api server.js] ERRO NÃO TRATADO CAPTURADO PELO MANIPULADOR GLOBAL:');
  console.error('Status do Erro:', err.status || 500);
  console.error('Mensagem do Erro:', err.message);
  console.error('Stack do Erro:', err.stack);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: err.message || 'Ocorreu um erro inesperado no servidor de e-mail.',
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Servidor EMAIL-API rodando na porta ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[email-api server.js] ERRO FATAL: A porta ${PORT} já está em uso.`);
    process.exit(1);
  } else {
    console.error('[email-api server.js] Erro ao iniciar o servidor:', err);
  }
});
