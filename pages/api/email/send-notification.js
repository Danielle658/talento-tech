// pages/api/email/send-notification.js
// Placeholder para uma futura API de envio de notificações genéricas por e-mail

// import { sendGenericNotificationEmail } from '../../../services/emailService'; // Exemplo

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'Campos obrigatórios: to, subject, e (text ou html).' });
    }

    try {
      // Lógica para enviar notificação genérica
      // Exemplo: await sendGenericNotificationEmail(to, subject, text, html);
      
      // Linha de log para simular
      console.log(\`Simulação: Notificação enviada para \${to} com assunto "\${subject}"\`);

      return res.status(200).json({ message: 'Notificação enviada com sucesso (simulado).' });
    } catch (error) {
      console.error('Erro ao enviar notificação (API):', error);
      return res.status(500).json({ error: 'Erro ao processar a solicitação de notificação.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(\`Method \${req.method} Not Allowed\`);
  }
}
