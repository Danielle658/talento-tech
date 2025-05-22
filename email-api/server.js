
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Configuração de CORS simplificada para permitir todas as origens,
// já que esta API é chamada internamente pelo proxy do Next.js.
app.use(cors());

app.use(bodyParser.json());

app.use('/api/email', emailRoutes);

// Manipulador de erro global para garantir respostas JSON
app.use((err, req, res, next) => {
  console.error("Erro não tratado no email-api:", err.stack || err.message || err);
  // Se headers já foram enviados, delegar para o manipulador de erro padrão do Express
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Erro interno no servidor da API de e-mail. Por favor, tente novamente mais tarde.' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
