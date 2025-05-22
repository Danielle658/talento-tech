// pages/api/email/send-password-reset.js
import { sendPasswordResetEmail } from '../../../services/emailService'; // Ajuste o caminho conforme a estrutura
import { generatePasswordResetToken } from '../../../utils/generateResetToken'; // Ajuste o caminho
import { ACCOUNT_DETAILS_STORAGE_KEY } from '../../../src/lib/constants'; // Para ler o email "cadastrado"

// Helper para simular a busca do e-mail cadastrado (substitua pela sua lógica de banco de dados real)
// Em um app real, você buscaria no seu banco de dados. Aqui, simulamos lendo do localStorage
// (que não é acessível diretamente no backend/API route, então isso é uma simplificação).
// Para um teste real, você precisaria de um mecanismo para o backend saber qual email está "cadastrado".
// Esta função é uma simulação e não funcionará como está para verificar um usuário real sem um DB.
async function getRegisteredEmail() {
    // Este é um placeholder. API Routes não têm acesso direto ao localStorage do browser.
    // Em um cenário real, você consultaria seu banco de dados.
    // Para este exemplo, retornaremos um email fixo ou nulo para simular.
    // Se você tem o ACCOUNT_DETAILS_STORAGE_KEY usado no frontend para guardar o email de registro:
    // você precisaria de alguma forma que o frontend passasse essa informação se quisesse usar localStorage
    // como "banco de dados simulado".
    // Uma melhor simulação: assumir que o email enviado na requisição é o que seria verificado.
  return null; // Ou retorne um e-mail de teste se quiser simular sucesso
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'O campo e-mail é obrigatório.' });
  }

  try {
    // Lógica para verificar se o usuário existe no seu banco de dados (simulado)
    // Em um app real: const user = await User.findOne({ email });
    // Aqui, para fins de demonstração e sem um DB, vamos apenas simular que se o email foi enviado,
    // e assumindo que o frontend já tem uma forma de saber se ele é um email válido de usuário,
    // prosseguimos. Uma verificação real de existência do email DEVE ser feita no backend.
    
    // Para uma simulação mais próxima:
    // Se você tiver uma forma de popular o e-mail do usuário no backend (ex: via um setup inicial ou DB):
    // const registeredEmail = await getRegisteredEmail(); // Esta função precisaria ser real
    // if (email.toLowerCase() !== registeredEmail?.toLowerCase()) {
    //   console.log(\`Tentativa de redefinição para e-mail não cadastrado (ou diferente do simulado): \${email}\`);
    //   // Não revele se o e-mail existe ou não por segurança, mas retorne sucesso
    //   return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
    // }

    // Gere um token de redefinição
    const userId = 'simulated_user_id_for_' + email.split('@')[0]; // Placeholder
    const resetToken = generatePasswordResetToken({ userId: userId, email: email });
    
    // Construa o link de redefinição
    // Certifique-se que FRONTEND_URL está definido no seu .env.local
    const resetLink = \`\${process.env.FRONTEND_URL || 'http://localhost:9002'}/auth/reset-password?token=\${resetToken}\`;

    // Envie o e-mail de redefinição
    await sendPasswordResetEmail(email, resetLink);

    // Responda sempre com sucesso para não revelar se um email existe ou não no sistema
    return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });

  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha (API):', error);
    // Não exponha detalhes do erro interno ao cliente
    return res.status(500).json({ error: 'Erro ao processar a solicitação de redefinição de senha.' });
  }
}
