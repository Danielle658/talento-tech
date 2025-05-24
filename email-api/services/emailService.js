
const nodemailer = require('nodemailer');
// JWT e generateResetToken não são mais necessários aqui pois a redefinição de senha foi removida.

console.log("[emailService] Script de serviço de e-mail carregado.");

let transporter;
let mailerConfigured = false;

try {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Variáveis de ambiente SMTP (HOST, PORT, USER, PASS) não estão completamente definidas.");
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: parseInt(process.env.SMTP_PORT) === 465, // true para porta 465, false para outras como 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
        // não falhar em certificados auto-assinados (apenas para desenvolvimento, se necessário)
        // rejectUnauthorized: false 
    }
  });
  console.log("[emailService] Transporter do Nodemailer configurado com sucesso.");
  mailerConfigured = true;
} catch (error) {
  console.error("[emailService] ERRO CRÍTICO AO CONFIGURAR NODEMAILER TRANSPORTER:", error.message);
  console.error("[emailService] Detalhes do erro:", error);
  console.error("[emailService] Verifique as variáveis SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS no arquivo .env da email-api.");
  console.error("[emailService] O envio de e-mails estará desabilitado até que isso seja corrigido.");
  transporter = null; // Garante que o transporter seja nulo se a configuração falhar
}


// A função sendPasswordResetEmail foi removida.

async function sendNotificationEmail(to, subject, message) {
  if (!mailerConfigured || !transporter) {
    console.error("[emailService] Tentativa de enviar notificação, mas o Nodemailer não está configurado devido a erro anterior.");
    throw new Error("Serviço de e-mail não está configurado corretamente. Verifique os logs do servidor.");
  }

  console.log(`[emailService] Preparando para enviar notificação para: ${to}, Assunto: ${subject}`);
  const mailOptions = {
    from: `"MoneyWise Notificações" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #0056b3; text-align: center;">MoneyWise Notificação</h2>
          <p>Olá,</p>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.9em; color: #777; text-align: center;">
            Esta é uma mensagem automática. Por favor, não responda diretamente a este e-mail.
          </p>
        </div>
      </div>
    `,
  };

  try {
    console.log("[emailService] Tentando enviar e-mail de notificação...");
    let info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] E-mail de notificação enviado com sucesso para ${to}. ID da Mensagem: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[emailService] Erro ao enviar e-mail de notificação para ${to}:`, error.message);
    console.error("[emailService] Detalhes do erro de envio:", error);
    throw new Error(`Falha ao enviar e-mail de notificação: ${error.message}`);
  }
}

module.exports = { sendNotificationEmail };
