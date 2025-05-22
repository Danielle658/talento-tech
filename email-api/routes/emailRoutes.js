const express = require('express');
const router = express.Router();
const { sendPasswordResetEmail, sendNotificationEmail } = require('../services/emailService');

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  try {
    await sendPasswordResetEmail(email);
    res.status(200).json({ message: 'E-mail de recuperação enviado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notify', async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    await sendNotificationEmail(to, subject, message);
    res.status(200).json({ message: 'Notificação enviada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;