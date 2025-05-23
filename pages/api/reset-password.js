
// pages/api/reset-password.js
import jwt from 'jsonwebtoken';
// A SIMULATED_CREDENTIALS_STORAGE_KEY não é usada aqui, pois a API não deve acessar o localStorage diretamente.
// A verificação de existência da conta e atualização da senha no localStorage é feita no cliente.

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Token, e-mail e nova senha são obrigatórios.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[API /api/reset-password] Erro: JWT_SECRET não está definido no ambiente do Next.js.');
      return res.status(500).json({ message: 'Erro de configuração no servidor.' });
    }

    try {
      // Verificar o token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // O payload do token deve conter o e-mail
      const emailFromToken = decoded.email;

      if (!emailFromToken) {
        return res.status(400).json({ message: 'Token inválido (não contém e-mail).' });
      }

      // Comparar o e-mail do token com o e-mail fornecido no formulário
      // Convertendo para minúsculas para comparação insensível a maiúsculas/minúsculas
      if (emailFromToken.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ message: 'Token não corresponde ao e-mail fornecido.' });
      }

      // Verificar o comprimento da nova senha
      if (password.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }

      // Se todas as verificações passarem, o token é considerado válido para este e-mail.
      // A atualização da senha no localStorage será feita pelo cliente após esta resposta.
      console.log(`[API /api/reset-password] Token validado com sucesso para o e-mail: ${email}`);
      return res.status(200).json({ message: 'Token validado. Prossiga com a redefinição da senha no cliente.' });

    } catch (error) {
      console.error('[API /api/reset-password] Erro ao verificar token:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expirado. Por favor, solicite um novo link de redefinição.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Token inválido ou malformado.' });
      }
      return res.status(500).json({ message: 'Erro interno ao validar o token.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Método ${req.method} não permitido` });
  }
}
