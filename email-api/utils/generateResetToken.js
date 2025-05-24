
// Este arquivo não é mais utilizado e pode ser removido.
// A funcionalidade de gerar token para redefinição de senha foi desabilitada.

// const jwt = require('jsonwebtoken');

// function generateResetToken(email) {
//   if (!process.env.JWT_SECRET) {
//     throw new Error('A variável de ambiente JWT_SECRET não está definida.');
//   }
//   return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
// }

// module.exports = { generateResetToken };
