
const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail } = require('../services/emailService');
const { generatePasswordResetToken } = require('../utils/generateResetToken');

// Rota para solicitar redefinição de senha
// POST /api/email/request-password-reset
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'O campo e-mail é obrigatório.' });
  }

  try {
    // Lógica para verificar se o usuário existe no seu banco de dados (não implementado aqui)
    // Por exemplo: const user = await User.findOne({ email });
    // if (!user) {
    //   // Não revele se o e-mail existe ou não por segurança, mas retorne sucesso
    //   console.log(\`Tentativa de redefinição para e-mail não cadastrado: \${email}\`);
    //   return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    // }

    // Gere um token de redefinição
    // const userId = user.id; // Ou qualquer identificador único do usuário
    const userId = 'id_do_usuario_simulado'; // Placeholder
    const resetToken = generatePasswordResetToken({ userId: userId, email: email });
    
    // Construa o link de redefinição
    const resetLink = \`\${process.env.FRONTEND_URL}/auth/reset-password?token=\${resetToken}\`;

    // Envie o e-mail de redefinição
    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação de redefinição de senha.' });
  }
});

// Você pode adicionar mais rotas aqui, como para validar o token e redefinir a senha de fato
// Exemplo:
// router.post('/reset-password', async (req, res) => { ... });

module.exports = router;
    