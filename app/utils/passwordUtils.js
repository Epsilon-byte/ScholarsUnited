// utils/passwordUtils.js
const bcrypt = require('bcryptjs');

// Function to hash a password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);  // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt);  // Hash the password
    return hashedPassword;
}

// Function to compare entered password with stored hashed password
async function comparePassword(enteredPassword, storedHashedPassword) {
    return await bcrypt.compare(enteredPassword, storedHashedPassword);
}

module.exports = { hashPassword, comparePassword };
