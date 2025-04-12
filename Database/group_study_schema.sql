-- Create table for group study sessions
CREATE TABLE IF NOT EXISTS StudyGroups (
    GroupID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    CourseID INT,
    CreatorID INT NOT NULL,
    MaxParticipants INT DEFAULT 10,
    IsPrivate BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE SET NULL,
    FOREIGN KEY (CreatorID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create table for study group members
CREATE TABLE IF NOT EXISTS StudyGroupMembers (
    MembershipID INT AUTO_INCREMENT PRIMARY KEY,
    GroupID INT NOT NULL,
    UserID INT NOT NULL,
    JoinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Role ENUM('creator', 'moderator', 'member') DEFAULT 'member',
    FOREIGN KEY (GroupID) REFERENCES StudyGroups(GroupID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (GroupID, UserID)
);

-- Create table for study sessions
CREATE TABLE IF NOT EXISTS StudySessions (
    SessionID INT AUTO_INCREMENT PRIMARY KEY,
    GroupID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Description TEXT,
    Date DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    Location VARCHAR(255),
    IsOnline BOOLEAN DEFAULT FALSE,
    MeetingLink VARCHAR(255),
    CreatorID INT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (GroupID) REFERENCES StudyGroups(GroupID) ON DELETE CASCADE,
    FOREIGN KEY (CreatorID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create table for session participants
CREATE TABLE IF NOT EXISTS SessionParticipants (
    ParticipantID INT AUTO_INCREMENT PRIMARY KEY,
    SessionID INT NOT NULL,
    UserID INT NOT NULL,
    Status ENUM('attending', 'maybe', 'declined') DEFAULT 'attending',
    JoinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SessionID) REFERENCES StudySessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (SessionID, UserID)
);

-- Create table for session resources
CREATE TABLE IF NOT EXISTS SessionResources (
    ResourceID INT AUTO_INCREMENT PRIMARY KEY,
    SessionID INT NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Description TEXT,
    FileURL VARCHAR(255),
    ExternalLink VARCHAR(255),
    UploadedBy INT NOT NULL,
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SessionID) REFERENCES StudySessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (UploadedBy) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_study_groups_course ON StudyGroups(CourseID);
CREATE INDEX idx_study_groups_creator ON StudyGroups(CreatorID);
CREATE INDEX idx_study_sessions_group ON StudySessions(GroupID);
CREATE INDEX idx_study_sessions_date ON StudySessions(Date);
CREATE INDEX idx_session_resources_session ON SessionResources(SessionID);
