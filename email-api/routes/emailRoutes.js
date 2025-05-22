
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendNotificationEmail } = require('../services/emailService');

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  console.log(`[email-api] Rota /reset-password chamada para o email: ${email}. Origem da requisição: ${req.headers.origin}`);
  try {
    await sendPasswordResetEmail(email);
    res.status(200).json({ message: 'E-mail de recuperação enviado.' });
  } catch (err) {
    console.error('Erro detalhado ao solicitar redefinição de senha (emailRoutes):', err);
    // Para o cliente, envie uma mensagem mais genérica
    res.status(500).json({ error: 'Erro interno ao tentar enviar e-mail de recuperação. Por favor, tente novamente mais tarde.' });
  }
});

router.post('/notify', async (req, res) => {
  const { to, subject, message } = req.body;
  console.log(`[email-api] Rota /notify chamada. Para: ${to}, Assunto: ${subject}. Origem da requisição: ${req.headers.origin}`);
  try {
    await sendNotificationEmail(to, subject, message);
    res.status(200).json({ message: 'Notificação enviada com sucesso.' });
  } catch (err) {
    console.error('Erro detalhado ao enviar notificação (emailRoutes):', err);
    // Para o cliente, envie uma mensagem mais genérica
    res.status(500).json({ error: 'Erro interno ao tentar enviar notificação. Por favor, tente novamente mais tarde.' });
  }
});

module.exports = router;
