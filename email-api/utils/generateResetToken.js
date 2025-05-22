const jwt = require('jsonwebtoken');

function generateResetToken(email) {
  // It's good practice to include more identifying info in the token if needed,
  // but for a simple reset, email might suffice if you verify it against your user database.
  // Ensure your JWT_SECRET is strong and kept secret.
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Optional: Add a function to verify tokens if this backend will also handle token verification
function verifyResetToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null; // Token is invalid or expired
  }
}

module.exports = { generateResetToken, verifyResetToken };