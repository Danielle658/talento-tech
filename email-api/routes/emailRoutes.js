
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

// Rota para solicitar código SMS (simulado)
router.post('/request-sms-code', async (req, res) => {
  console.log('[email-api] Rota /request-sms-code chamada.');
  const { phone } = req.body;
  if (!phone) {
    console.error('[email-api] Erro: Número de telefone não fornecido para solicitar código SMS.');
    return res.status(400).json({ error: 'Número de telefone é obrigatório.' });
  }
  // SIMULAÇÃO: Em um sistema real, aqui você chamaria um gateway de SMS.
  console.log(`[email-api] SIMULAÇÃO: Código SMS solicitado para o telefone: ${phone}. (Nenhum SMS real será enviado)`);
  // Por segurança, não confirme se o número está cadastrado ou não diretamente na resposta.
  res.status(200).json({ message: 'Se o número estiver cadastrado, um código SMS (simulado) será considerado enviado.' });
});

// Rota para verificar código SMS (simulação removida do código fixo)
router.post('/verify-sms-code', async (req, res) => {
  console.log('[email-api] Rota /verify-sms-code chamada.');
  const { phone, code } = req.body;

  if (!phone || !code) {
    console.error('[email-api] Erro: Telefone ou código não fornecido para verificação SMS.');
    return res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
  }
  console.log(`[email-api] Tentativa de verificação de SMS para telefone: ${phone} com código: ${code}.`);

  // SIMULAÇÃO REMOVIDA: Em um sistema real, aqui você validaria o código contra um valor gerado e armazenado.
  // Para remover a simulação do "código mágico", vamos apenas aceitar qualquer código fornecido (não vazio).
  // Isso não é seguro para produção, mas remove a necessidade de digitar "000000".
  if (code && code.trim() !== "") {
    console.log(`[email-api] SIMULAÇÃO DE PROTÓTIPO: Código SMS "${code}" aceito para o telefone: ${phone} (verificação real não implementada).`);
    // Em um sistema real, você poderia gerar um token temporário aqui para autorizar a redefinição de senha.
    res.status(200).json({ message: 'Código SMS verificado com sucesso (simulado).' });
  } else {
    // Esta parte não deveria ser alcançada se a validação acima for suficiente.
    console.log(`[email-api] SIMULAÇÃO DE PROTÓTIPO: Código SMS "${code}" considerado INVÁLIDO para o telefone: ${phone}.`);
    res.status(400).json({ error: 'Código SMS inválido ou expirado (simulado).' });
  }
});

module.exports = router;
