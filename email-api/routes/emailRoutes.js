
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendNotificationEmail } = require('../services/emailService');

router.post('/reset-password', async (req, res) => {
  console.log('[email-api] Rota /reset-password chamada.');
  console.log('[email-api] Corpo da requisição recebido:', req.body);
  console.log(`[email-api] Cabeçalho Origin da requisição: ${req.headers.origin}`);

  const { email } = req.body;

  if (!email) {
    console.error('[email-api] Erro: E-mail não fornecido no corpo da requisição.');
    return res.status(400).json({ error: 'O campo e-mail é obrigatório.' });
  }

  try {
    await sendPasswordResetEmail(email);
    console.log(`[email-api] E-mail de recuperação solicitado para: ${email} - Processamento bem-sucedido.`);
    res.status(200).json({ message: 'E-mail de recuperação enviado.' });
  } catch (err) {
    console.error('[email-api] Erro detalhado ao solicitar redefinição de senha (emailRoutes):', err.message, err.stack);
    res.status(500).json({ error: 'Erro interno ao tentar enviar e-mail de recuperação. Por favor, tente novamente mais tarde.' });
  }
});

router.post('/notify', async (req, res) => {
  console.log('[email-api] Rota /notify chamada.');
  console.log('[email-api] Corpo da requisição recebido:', req.body);
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    console.error('[email-api] Erro: Destinatário, assunto ou mensagem não fornecidos para notificação.');
    return res.status(400).json({ error: 'Destinatário, assunto e mensagem são obrigatórios para notificação.' });
  }

  try {
    await sendNotificationEmail(to, subject, message);
    console.log(`[email-api] Notificação enviada para: ${to} com assunto: ${subject} - Processamento bem-sucedido.`);
    res.status(200).json({ message: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('[email-api] Erro detalhado ao enviar notificação (emailRoutes):', err.message, err.stack);
    res.status(500).json({ error: 'Erro interno ao tentar enviar notificação. Por favor, tente novamente mais tarde.' });
  }
});

module.exports = router;
