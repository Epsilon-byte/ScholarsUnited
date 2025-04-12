// Password reset service
const db = require('./db');
const nodemailer = require('nodemailer');
const cryptoRandomString = require('crypto-random-string');
const dotenv = require('dotenv');

dotenv.config();

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email', // Default for testing
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Generate a random token
const generateToken = async () => {
  return cryptoRandomString({ length: 64, type: 'url-safe' });
};

// Create a password reset token for a user
const createResetToken = async (userId) => {
  try {
    // Generate a random token
    const token = await generateToken();
    
    // Set expiry to 1 hour from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);
    
    // Store token in database
    await db.query(
      'INSERT INTO PasswordResetTokens (UserID, Token, ExpiryDate) VALUES (?, ?, ?)',
      [userId, token, expiryDate]
    );
    
    return token;
  } catch (error) {
    console.error('Error creating reset token:', error);
    throw new Error('Failed to create password reset token. Please try again later.');
  }
};

// Verify if a token is valid
const verifyToken = async (token) => {
  try {
    const [results] = await db.query(
      'SELECT * FROM PasswordResetTokens WHERE Token = ? AND ExpiryDate > NOW() AND Used = FALSE',
      [token]
    );
    
    if (results && results.length > 0) {
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Failed to verify reset token. Please try again later.');
  }
};

// Mark a token as used after password reset
const markTokenAsUsed = async (tokenId) => {
  try {
    await db.query(
      'UPDATE PasswordResetTokens SET Used = TRUE WHERE TokenID = ?',
      [tokenId]
    );
    
    return true;
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw new Error('Failed to update token status. Please try again later.');
  }
};

// Send password reset email
const sendResetEmail = async (email, token, fullName) => {
  try {
    // Create reset URL with HTTPS if in production
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.APP_URL || 'https://scholarsunited.com')
      : 'http://localhost:3000';
    
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Scholars United" <noreply@scholarsunited.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Hello, ${fullName}</h1>
        <p>You requested a password reset for your Scholars United account.</p>
        <p>Please click the link below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
        <p>Thank you,<br>The Scholars United Team</p>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
};

module.exports = {
  createResetToken,
  verifyToken,
  markTokenAsUsed,
  sendResetEmail
};
