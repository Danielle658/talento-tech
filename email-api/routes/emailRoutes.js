
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendNotificationEmail } = require('../services/emailService');

router.post('/reset-password', async (req, res) => {
  console.log('[email-api] Rota /reset-password chamada.');
  console.log('[email-api] Corpo da requisição recebido:', JSON.stringify(req.body, null, 2));
  console.log(`[email-api] Cabeçalho Origin da requisição: ${req.headers.origin || 'N/A (proxy Next.js?)'}`);

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
    console.error('[email-api] ERRO CAPTURADO na rota /reset-password:', err.message, err.stack, err);
    res.status(500).json({ error: 'Erro interno ao tentar enviar e-mail de recuperação. Por favor, verifique os logs do servidor email-api.' });
  }
});

router.post('/notify', async (req, res) => {
  console.log('[email-api] Rota /notify chamada.');
  console.log('[email-api] Corpo da requisição recebido:', JSON.stringify(req.body, null, 2));
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
    console.error('[email-api] ERRO CAPTURADO na rota /notify:', err.message, err.stack, err);
    res.status(500).json({ error: 'Erro interno ao tentar enviar notificação. Por favor, verifique os logs do servidor email-api.' });
  }
});

// Nova rota para solicitar código SMS (simulado)
router.post('/request-sms-code', async (req, res) => {
  console.log('[email-api] Rota /request-sms-code chamada.');
  const { phone } = req.body;
  if (!phone) {
    console.error('[email-api] Erro: Número de telefone não fornecido para solicitar código SMS.');
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }
  // SIMULAÇÃO: Em um sistema real, aqui você chamaria um gateway de SMS.
  console.log(`[email-api] SIMULAÇÃO: Código SMS solicitado para o telefone: ${phone}.`);
  // Por segurança, não confirme se o número está cadastrado ou não.
  res.status(200).json({ message: 'Se o número estiver cadastrado, um código SMS será enviado em breve.' });
});

// Nova rota para verificar código SMS (simulado)
router.post('/verify-sms-code', async (req, res) => {
  console.log('[email-api] Rota /verify-sms-code chamada.');
  const { phone, code } = req.body;
  if (!phone || !code) {
    console.error('[email-api] Erro: Telefone ou código não fornecido para verificação SMS.');
    return res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
  }

  // SIMULAÇÃO: Verifique o código. Use "000000" como código válido para teste.
  const SIMULATED_VALID_CODE = "000000";
  if (code === SIMULATED_VALID_CODE) {
    console.log(`[email-api] SIMULAÇÃO: Código SMS "${code}" verificado com SUCESSO para o telefone: ${phone}.`);
    // Em um sistema real, você poderia gerar um token temporário aqui para autorizar a redefinição de senha.
    res.status(200).json({ message: 'Código SMS verificado com sucesso.' });
  } else {
    console.log(`[email-api] SIMULAÇÃO: Código SMS "${code}" INVÁLIDO para o telefone: ${phone}.`);
    res.status(400).json({ error: 'Código SMS inválido ou expirado.' });
  }
});

module.exports = router;
