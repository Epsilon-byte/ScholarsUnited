-- Create a table to store password reset tokens
CREATE TABLE IF NOT EXISTS PasswordResetTokens (
    TokenID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Token VARCHAR(100) NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    Used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create index for faster token lookups
CREATE INDEX idx_token ON PasswordResetTokens(Token);
