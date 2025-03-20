-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: db
-- Generation Time: Oct 30, 2022 at 09:54 AM
-- Server version: 8.0.24
-- PHP Version: 7.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `StudyBuddies`
-- Database run on 127.0.0.1:8082
-- Database run on port 3309:3306

-- --------------------------------------------------------

--
--
--
-- Create database
CREATE DATABASE IF NOT EXISTS StudyBuddies;
USE StudyBuddies;

-- Users Table
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    FullName VARCHAR(255),
    Interests TEXT,
    Hobbies TEXT,
    AcademicInfo TEXT,
    AvailableTime VARCHAR(255)
);

-- Interests Table
CREATE TABLE Interests (
    InterestID INT AUTO_INCREMENT PRIMARY KEY,
    InterestName VARCHAR(100) NOT NULL UNIQUE
);

-- UserInterests Table (Many-to-Many Relationship)
CREATE TABLE UserInterests (
    UserID INT,
    InterestID INT,
    PRIMARY KEY (UserID, InterestID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (InterestID) REFERENCES Interests(InterestID) ON DELETE CASCADE
);

-- Courses Table
CREATE TABLE Courses (
    CourseID INT AUTO_INCREMENT PRIMARY KEY,
    CourseName VARCHAR(100) NOT NULL UNIQUE
);

-- UserCourses Table (Many-to-Many Relationship)
CREATE TABLE UserCourses (
    UserID INT,
    CourseID INT,
    PRIMARY KEY (UserID, CourseID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID) ON DELETE CASCADE
);

-- Events Table
CREATE TABLE Events (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(100),
    Description TEXT,
    Date DATE,
    Time TIME,
    Location VARCHAR(255),
    UserID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- EventParticipants Table (Many-to-Many Relationship)
CREATE TABLE EventParticipants (
    UserID INT,
    EventID INT,
    PRIMARY KEY (UserID, EventID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE Messages (
    MessageID INT AUTO_INCREMENT PRIMARY KEY,
    SenderID INT,
    ReceiverID INT,
    Content TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SenderID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- BuddyRequests Table
CREATE TABLE BuddyRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    SenderID INT,
    ReceiverID INT,
    Status ENUM('Pending', 'Accepted', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (SenderID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ReceiverID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Message TEXT,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ReadNotif TINYINT(1) DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- Insert sample Users
INSERT INTO Users (UserID, FullName, Email, Interests, Hobbies, AcademicInfo, AvailableTime) VALUES
(1, 'Alice Johnson', 'alice.johnson@university.edu', 'Machine Learning, AI', 'Coding, Reading', 'Computer Science Major', '08:00 - 18:00'),
(2, 'Bob Smith', 'bob.smith@university.edu', 'Cybersecurity, Ethical Hacking', 'Gaming, Blogging', 'Cybersecurity Student', '09:00 - 17:00'),
(3, 'Charlie Davis', 'charlie.davis@university.edu', 'Data Science, Big Data', 'Cooking, Traveling', 'Data Science Major', '10:00 - 20:00'),
(4, 'Diana Evans', 'diana.evans@university.edu', 'Software Engineering, DevOps', 'Chess, Running', 'Software Engineering Major', '06:00 - 14:00'),
(5, 'Ethan Wilson', 'ethan.wilson@university.edu', 'Game Development, AI', 'Sketching, Music', 'Game Development Major', '11:00 - 19:00');

-- Insert sample Interests
INSERT INTO Interests (InterestID, InterestName) VALUES
(1, 'Machine Learning'),
(2, 'Cybersecurity'),
(3, 'Data Science'),
(4, 'Software Engineering'),
(5, 'Game Development'),
(6, 'Cloud Computing'),
(7, 'Blockchain Technology'),
(8, 'Internet of Things (IoT)'),
(9, 'Artificial Intelligence'),
(10, 'Web Development'),
(11, 'Mobile App Development'),
(12, 'Embedded Systems'),
(13, 'Robotics'),
(14, 'Virtual Reality (VR)'),
(15, 'Augmented Reality (AR)'),
(16, 'Computer Vision'),
(17, 'Natural Language Processing (NLP)'),
(18, 'Big Data Analytics'),
(19, 'Quantum Computing'),
(20, 'Software Testing & QA'),
(21, 'Ethical Hacking & Penetration Testing'),
(22, 'Computer Graphics & Animation'),
(23, 'Distributed Systems'),
(24, 'Human-Computer Interaction (HCI)'),
(25, 'Bioinformatics & Computational Biology');

-- Insert sample Courses
INSERT INTO Courses (CourseID, CourseName) VALUES
(1, 'Introduction to AI'),
(2, 'Network Security & Ethical Hacking'),
(3, 'Big Data Analytics'),
(4, 'Advanced Software Development'),
(5, 'Game Engine Design');

-- Insert sample UserInterests
INSERT INTO UserInterests (UserID, InterestID) VALUES
(1, 1),
(1, 9),
(1, 18),
(2, 2),
(2, 21),
(3, 3),
(3, 18),
(4, 4),
(4, 16),
(5, 5),
(5, 10);

-- Insert sample UserCourses
INSERT INTO UserCourses (UserID, CourseID) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- Insert sample Events
INSERT INTO Events (EventID, Title, Description, Date, Time, Location, UserID) VALUES
(1, 'AI Symposium 2024', 'A conference on the latest in AI', '2024-08-15', '09:00:00', 'Silicon Valley', 1),
(2, 'Cybersecurity Hackathon', 'A competition for ethical hackers', '2024-09-10', '10:00:00', 'New York', 2);

-- Insert sample EventParticipants
INSERT INTO EventParticipants (UserID, EventID) VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 1);

-- Insert sample Messages
INSERT INTO Messages (MessageID, SenderID, ReceiverID, Content, Timestamp) VALUES
(1, 1, 2, 'Hey, are you attending the AI Symposium?', '2024-07-10 12:00:00'),
(2, 2, 3, 'Yes! Are you joining the hackathon?', '2024-07-10 12:05:00');

-- Insert sample BuddyRequests
INSERT INTO BuddyRequests (RequestID, SenderID, ReceiverID, Status) VALUES
(1, 1, 2, 'Pending'),
(2, 3, 4, 'Accepted');

-- Insert sample Notifications
INSERT INTO Notifications (NotificationID, UserID, Message, Timestamp) VALUES
(1, 1, 'You have a new message from Bob Smith', '2024-07-11 09:00:00'),
(2, 2, 'Event reminder: Cybersecurity Hackathon', '2024-07-12 10:00:00');

-- Changes to accommodate the new values in Notifications table
ALTER TABLE Notifications ADD COLUMN Read BOOLEAN DEFAULT FALSE;