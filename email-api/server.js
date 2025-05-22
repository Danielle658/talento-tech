
// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Habilita CORS para todas as origens (ajuste para produção)
app.use(bodyParser.json()); // Para parsear o corpo das requisições JSON

// Rotas
app.use('/api/email', emailRoutes);

// Rota de health check
app.get('/', (req, res) => {
  res.send('API de E-mail está funcionando!');
});

// Tratamento de erro básico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Algo deu errado no servidor!' });
});

app.listen(PORT, () => {
  console.log(\`Servidor da API de E-mail rodando na porta \${PORT}\`);
});
    