-- Create Events table if it doesn't exist
CREATE TABLE IF NOT EXISTS Events (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Date DATE NOT NULL,
    Time TIME,
    Location VARCHAR(255),
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create EventParticipants table if it doesn't exist
CREATE TABLE IF NOT EXISTS EventParticipants (
    ParticipantID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    JoinDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (UserID, EventID)
);

-- Create EventMessages table if it doesn't exist
CREATE TABLE IF NOT EXISTS EventMessages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    SenderID INT NOT NULL,
    EventID INT NOT NULL,
    Content TEXT NOT NULL,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SenderID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_event_date ON Events(Date);
CREATE INDEX idx_event_user ON Events(UserID);
CREATE INDEX idx_participant_event ON EventParticipants(EventID);
CREATE INDEX idx_participant_user ON EventParticipants(UserID);
CREATE INDEX idx_event_messages_event ON EventMessages(EventID);
CREATE INDEX idx_event_messages_sender ON EventMessages(SenderID);
