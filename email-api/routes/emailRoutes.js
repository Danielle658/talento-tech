
const express = require('express');
const router = express.Router();
const { sendNotificationEmail } = require('../services/emailService');
// A funcionalidade de redefinição de senha foi removida, então sendPasswordResetEmail não é mais necessário aqui.

console.log("[email-api emailRoutes.js] Script de rotas carregado.");

// Rota para envio de notificações gerais
router.post('/notify', async (req, res, next) => {
  console.log("[email-api] Rota /notify chamada.");
  try {
    const { to, subject, message } = req.body;
    console.log("[email-api] Corpo da requisição recebido para /notify:", JSON.stringify(req.body, null, 2));

    if (!to || !subject || !message) {
      console.warn("[email-api] Requisição para /notify com campos faltando:", { to, subject, message });
      return res.status(400).json({ error: 'Campos "to", "subject", e "message" são obrigatórios.' });
    }

    await sendNotificationEmail(to, subject, message);
    console.log(`[email-api] Notificação enviada com sucesso para: ${to}`);
    res.status(200).json({ message: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('[email-api] Erro na rota /notify:', err.message);
    console.error(err.stack);
    // Passa o erro para o próximo manipulador de erro (o global no server.js)
    // ou envia uma resposta de erro JSON diretamente.
    res.status(500).json({ 
        error: 'Erro ao enviar notificação.',
        details: err.message 
    });
  }
});

// As rotas relacionadas à redefinição de senha foram removidas.

module.exports = router;
