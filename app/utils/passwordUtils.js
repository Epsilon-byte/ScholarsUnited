// utils/passwordUtils.js
const bcrypt = require('bcryptjs'); // Import bcryptjs for hashing passwords

// Function to hash a password
// This function takes a password as input and returns the hashed password
// It uses bcrypt to generate a salt and hash the password
async function hashPassword(password) { 
    const salt = await bcrypt.genSalt(10);  // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt);  // Hashes the password
    return hashedPassword;
}

// A Function to compare entered password with stored hashed password
// This function takes an entered password and a stored hashed password as input
// It uses bcrypt to compare the entered password with the stored hashed password
async function comparePassword(enteredPassword, storedHashedPassword) {
    return await bcrypt.compare(enteredPassword, storedHashedPassword);
}

module.exports = { hashPassword, comparePassword };
