-- Create EventMessages table
CREATE TABLE IF NOT EXISTS EventMessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    SenderID INT NOT NULL,
    EventID INT NOT NULL,
    Content TEXT NOT NULL,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SenderID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_messages_event ON EventMessages(EventID);
CREATE INDEX IF NOT EXISTS idx_event_messages_sender ON EventMessages(SenderID);
