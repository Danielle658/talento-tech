const jwt = require('jsonwebtoken');

function generateResetToken(email) {
  if (!process.env.JWT_SECRET) {
    throw new Error('A variável de ambiente JWT_SECRET não está definida.');
  }
  // Considerar adicionar mais informações se necessário, como um ID de usuário.
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function verifyResetToken(token) {
  if (!process.env.JWT_SECRET) {
    console.error('A variável de ambiente JWT_SECRET não está definida para verificação.');
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('Erro ao verificar o token:', err.message);
    return null; // Token inválido ou expirado
  }
}

module.exports = { generateResetToken, verifyResetToken };
