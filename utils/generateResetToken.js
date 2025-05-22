const jwt = require('jsonwebtoken');

/**
 * Gera um token JWT para redefinição de senha.
 * @param {object} payload - Os dados para incluir no token (ex: { userId: '123', email: 'user@example.com' }).
 * @returns {string} O token JWT gerado.
 */
function generatePasswordResetToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('A variável de ambiente JWT_SECRET não está definida.');
  }
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || '1h' } // O token expira em 1 hora por padrão
  );
}

/**
 * Verifica e decodifica um token JWT.
 * @param {string} token - O token JWT a ser verificado.
 * @returns {object | null} O payload decodificado se o token for válido, caso contrário null.
 */
function verifyPasswordResetToken(token) {
  if (!process.env.JWT_SECRET) {
    console.error('A variável de ambiente JWT_SECRET não está definida para verificação.');
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Erro ao verificar o token:', error.message);
    return null; // Token inválido ou expirado
  }
}

module.exports = {
  generatePasswordResetToken,
  verifyPasswordResetToken,
};
