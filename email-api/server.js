
require('dotenv').config();
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


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Servidor EMAIL-API rodando na porta ${PORT}`));
