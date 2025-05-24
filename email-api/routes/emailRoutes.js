
const express = require('express');
const router = express.Router();
const { sendNotificationEmail } = require('../services/emailService');

// Rota /reset-password removida
// router.post('/reset-password', async (req, res) => { ... });

router.post('/notify', async (req, res) => {
  console.log('[email-api] Rota /notify chamada.');
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    console.error('[email-api] Erro: Destinatário, assunto ou mensagem não fornecidos para notificação.');
    return res.status(400).json({ error: 'Destinatário, assunto e mensagem são obrigatórios para notificação.' });
  }
  console.log(`[email-api] Corpo da requisição recebido para /notify: ${JSON.stringify(req.body, null, 2)}`);

  try {
    await sendNotificationEmail(to, subject, message);
    console.log(`[email-api] Notificação enviada para: ${to} com assunto: ${subject} - Processamento bem-sucedido.`);
    res.status(200).json({ message: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('[email-api] ERRO CAPTURADO na rota /notify:', err.message, err.stack, err);
    res.status(500).json({ error: 'Erro interno ao tentar enviar notificação. Por favor, verifique os logs do servidor email-api.' });
  }
});

// Rotas SMS removidas
// router.post('/request-sms-code', async (req, res) => { ... });
// router.post('/verify-sms-code', async (req, res) => { ... });

module.exports = router;
