
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Configuração de CORS mais explícita
const allowedOrigins = [
  'http://localhost:9005', // Porta padrão do seu app Next.js localmente
  'http://localhost:3000', // Outra porta comum para Next.js
  'https://9005-firebase-studio-1747837393667.cluster-duylic2g3fbzerqpzxxbw6helm.cloudworkstations.dev' // Sua origem do Cloud Workstations
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como mobile apps ou curl) ou se a origem está na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

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
