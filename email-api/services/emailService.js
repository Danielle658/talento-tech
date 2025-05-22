
const nodemailer = require('nodemailer');

// Configuração do transporter do Nodemailer
// Certifique-se de que as variáveis de ambiente estão definidas no seu arquivo .env
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // ex: 'gmail'
  host: process.env.EMAIL_HOST,     // ex: 'smtp.gmail.com'
  port: parseInt(process.env.EMAIL_PORT || "587"), // ex: 587 ou 465
  secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER, // seu e-mail
    pass: process.env.EMAIL_PASS, // sua senha (ou senha de app se usando Gmail com 2FA)
  },
  // Adicione isso se estiver enfrentando problemas com certificados autoassinados (apenas para desenvolvimento)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

/**
 * Envia um e-mail de redefinição de senha.
 * @param {string} toEmail - O e-mail do destinatário.
 * @param {string} resetLink - O link para a página de redefinição de senha.
 */
async function sendPasswordResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: \`MoneyWise <\${process.env.EMAIL_FROM_ADDRESS}>\`,
    to: toEmail,
    subject: 'Redefinição de Senha - MoneyWise',
    html: \`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #556B2F;">Redefinição de Senha</h2>
        <p>Olá,</p>
        <p>Você solicitou a redefinição da sua senha para o MoneyWise.</p>
        <p>Por favor, clique no link abaixo para criar uma nova senha:</p>
        <p style="margin: 20px 0;">
          <a href="\${resetLink}" 
             style="background-color: #6B8E23; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Redefinir Senha
          </a>
        </p>
        <p>Se você não solicitou esta redefinição, por favor, ignore este e-mail. Sua senha permanecerá inalterada.</p>
        <p>O link de redefinição é válido por \${process.env.RESET_TOKEN_EXPIRES_IN || '1 hora'}.</p>
        <br>
        <p>Obrigado,</p>
        <p>Equipe MoneyWise</p>
      </div>
    \`,
    // text: \`Olá,\\n\\nVocê solicitou a redefinição da sua senha para o MoneyWise.\\nPor favor, copie e cole o seguinte link no seu navegador para criar uma nova senha:\\n\${resetLink}\\n\\nSe você não solicitou esta redefinição, por favor, ignore este e-mail.\\n\\nObrigado,\\nEquipe MoneyWise\`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail de redefinição enviado: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error);
    throw new Error('Não foi possível enviar o e-mail de redefinição.');
  }
}

// Você pode adicionar outras funções de envio de e-mail aqui (ex: e-mail de boas-vindas)

module.exports = {
  sendPasswordResetEmail,
};
    