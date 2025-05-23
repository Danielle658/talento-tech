
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendNotificationEmail } = require('../services/emailService');

router.post('/reset-password', async (req, res) => {
  console.log('[email-api] Rota /reset-password chamada.');
  const { email } = req.body;

  if (!email) {
    console.error('[email-api] Erro: E-mail não fornecido no corpo da requisição.');
    return res.status(400).json({ error: 'O campo e-mail é obrigatório.' });
  }
  console.log(`[email-api] Corpo da requisição recebido para /reset-password: ${JSON.stringify(req.body, null, 2)}`);
  console.log(`[email-api] Cabeçalho Origin da requisição: ${req.headers.origin || 'N/A (proxy Next.js?)'}`);


  try {
    await sendPasswordResetEmail(email);
    console.log(`[email-api] E-mail de recuperação solicitado para: ${email} - Processamento bem-sucedido.`);
    res.status(200).json({ message: 'E-mail de recuperação enviado.' });
  } catch (err) {
    console.error('[email-api] ERRO CAPTURADO na rota /reset-password:', err.message, err.stack, err);
    res.status(500).json({ error: 'Erro interno ao tentar enviar e-mail de recuperação. Por favor, verifique os logs do servidor email-api.' });
  }
});

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
