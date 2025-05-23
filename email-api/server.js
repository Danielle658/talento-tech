
require('dotenv').config(); // DEVE SER A PRIMEIRA LINHA

// Logs de diagnóstico para verificar se as variáveis de ambiente foram carregadas
console.log('[email-api] Diagnóstico do .env:');
console.log('[email-api] SMTP_HOST:', process.env.SMTP_HOST);
console.log('[email-api] SMTP_PORT:', process.env.SMTP_PORT);
console.log('[email-api] SMTP_USER:', process.env.SMTP_USER ? 'Definido (não exibir)' : 'NÃO DEFINIDO ou vazio');
console.log('[email-api] SMTP_PASS:', process.env.SMTP_PASS ? 'Definido (não exibir)' : 'NÃO DEFINIDO ou vazio');
console.log('[email-api] JWT_SECRET:', process.env.JWT_SECRET ? 'Definido (não exibir)' : 'NÃO DEFINIDO ou vazio');
console.log('[email-api] CLIENT_URL:', process.env.CLIENT_URL);
console.log('[email-api] PORT (do .env):', process.env.PORT);


const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Configuração de CORS para permitir todas as origens.
// Isso é seguro porque esta API é chamada internamente pelo proxy do Next.js.
console.log("EMAIL-API: Aplicando configuração CORS para permitir todas as origens.");
app.use(cors()); 

app.use(bodyParser.json());

app.use('/api/email', emailRoutes);

// Manipulador de erro global para garantir respostas JSON
// Deve ser o último middleware adicionado com app.use()
app.use((err, req, res, next) => {
  console.error("EMAIL-API: Erro não tratado pelo manipulador de erro global:", err.stack || err.message || err);
  // Se headers já foram enviados, delegar para o manipulador de erro padrão do Express
  if (res.headersSent) {
    console.error("EMAIL-API: Headers já enviados, delegando para o próximo manipulador de erro.");
    return next(err);
  }
  res.status(500).json({ error: 'Erro interno no servidor da API de e-mail. Por favor, tente novamente mais tarde (via global handler).' });
});


const PORT_FROM_ENV = process.env.PORT || 5001; // Usa a variável PORT do .env ou 5001 como padrão
app.listen(PORT_FROM_ENV, () => console.log(`Servidor EMAIL-API rodando na porta ${PORT_FROM_ENV}`));
