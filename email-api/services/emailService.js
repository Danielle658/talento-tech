
const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken'); // JWT não é mais usado aqui
// const { generateResetToken } = require('../utils/generateResetToken'); // generateResetToken não é mais usado

let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465', // true para SSL (porta 465), false para TLS (porta 587)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[emailService] Transporter do Nodemailer configurado com sucesso.');
} catch (error) {
  console.error('[emailService] ERRO CRÍTICO ao configurar o transporter do Nodemailer:', error.message, error.stack);
  // Em uma aplicação real, você pode querer impedir o início do servidor se o transporter falhar.
  // Por agora, apenas logamos o erro. As funções de envio falharão se o transporter não estiver definido.
}

// Função sendPasswordResetEmail removida
// async function sendPasswordResetEmail(email) { ... }

async function sendNotificationEmail(to, subject, message) {
  if (!transporter) {
    console.error('[emailService] Tentativa de enviar e-mail de notificação, mas o transporter não está configurado.');
    throw new Error('Serviço de e-mail não está configurado corretamente.');
  }

  const mailOptions = {
    from: `"Notificações MoneyWise" <${process.env.SMTP_USER}>`,
    to,
    subject: subject || 'Notificação de MoneyWise',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #556B2F;">Notificação de MoneyWise</h2>
        <p>${message}</p>
        <br>
        <p>Atenciosamente,</p>
        <p>Equipe MoneyWise</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[emailService] E-mail de notificação enviado: %s para %s', info.messageId, to);
  } catch (error) {
    console.error('[emailService] Erro ao enviar e-mail de notificação:', error.message, error.stack);
    throw new Error(error.message || 'Não foi possível enviar o e-mail de notificação.');
  }
}

module.exports = { sendNotificationEmail }; // Exporta apenas a função restante
