const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { generateResetToken } = require('../utils/generateResetToken');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(email) {
  const token = generateResetToken(email);

  // Ensure CLIENT_URL is defined in your .env for the backend
  const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`; // Adjusted path to match typical Next.js auth flow

  const mailOptions = {
    from: `"Suporte MoneyWise" <${process.env.SMTP_USER}>`, // Added a name to the sender
    to: email,
    subject: 'Recuperação de senha - MoneyWise', // Added app name to subject
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação da sua senha para o MoneyWise.</p>
        <p>Por favor, clique no link abaixo para criar uma nova senha:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #6B8E23; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Redefinir Senha
          </a>
        </p>
        <p>Se você não solicitou esta redefinição, por favor, ignore este e-mail.</p>
        <p>O link de redefinição é válido por 1 hora.</p>
        <br>
        <p>Obrigado,</p>
        <p>Equipe MoneyWise</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendNotificationEmail(to, subject, message) {
  const mailOptions = {
    from: `"Notificações MoneyWise" <${process.env.SMTP_USER}>`, // Added app name
    to,
    subject,
    html: `<p>${message}</p>`, // Consider more structured HTML for notifications too
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail, sendNotificationEmail };