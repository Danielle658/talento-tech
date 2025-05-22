
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Configuração de CORS mais explícita para desenvolvimento
app.use(cors({
  origin: '*' // Permite todas as origens
}));

app.use(bodyParser.json());

app.use('/api/email', emailRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
