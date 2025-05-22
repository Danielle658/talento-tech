const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken'); // JWT é usado em generateResetToken
const { generateResetToken } = require('../utils/generateResetToken');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // false para TLS (porta 587), true para SSL (porta 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Aqui vai a senha de aplicativo gerada
  },
  // Descomente a seção tls abaixo se estiver enfrentando problemas com certificados autoassinados em desenvolvimento
  // tls: {
  //   rejectUnauthorized: false
  // }
});

async function sendPasswordResetEmail(email) {
  const token = generateResetToken(email);

  // Ajustado para corresponder à rota do frontend do Next.js
  const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Suporte MoneyWise" <${process.env.SMTP_USER}>`, // Mantido o nome mais descritivo
    to: email,
    subject: 'Recuperação de Senha - MoneyWise', // Mantido o assunto mais descritivo
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #556B2F;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação da sua senha para o MoneyWise.</p>
        <p>Por favor, clique no link abaixo para criar uma nova senha:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #6B8E23; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Redefinir Senha
          </a>
        </p>
        <p>Se você não solicitou esta redefinição, por favor, ignore este e-mail. Sua senha permanecerá inalterada.</p>
        <p>O link de redefinição é válido por 1 hora.</p>
        <br>
        <p>Obrigado,</p>
        <p>Equipe MoneyWise</p>
      </div>
    `, // Mantido o HTML mais rico
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail de redefinição enviado: %s', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição (emailService):', error);
    throw new Error('Não foi possível enviar o e-mail de redefinição.');
  }
}

async function sendNotificationEmail(to, subject, message) {
  const mailOptions = {
    from: `"Notificações MoneyWise" <${process.env.SMTP_USER}>`, // Mantido o nome mais descritivo
    to,
    subject: subject || 'Notificação de MoneyWise', // Mantido o assunto padrão
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #556B2F;">Notificação de MoneyWise</h2>
        <p>${message}</p>
        <br>
        <p>Atenciosamente,</p>
        <p>Equipe MoneyWise</p>
      </div>
    `, // Mantido o HTML mais rico
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail de notificação enviado: %s', info.messageId);
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificação (emailService):', error);
    throw new Error('Não foi possível enviar o e-mail de notificação.');
  }
}

module.exports = { sendPasswordResetEmail, sendNotificationEmail };