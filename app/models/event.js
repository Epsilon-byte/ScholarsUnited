// models/event.js

const db = require("../services/db"); // Import database connection

class Event {
    // ... (constructor and getEventDetails() as in the previous response) 
    constructor(id) {
        this.id = id;
        this.name = null;
        this.description = null;
        this.date = null;
        this.time = null;
        this.location = null;
        this.userId = null;
        this.participants = null; // Initialize participants to null or an empty array []
    }

    // Fetch event participants
    async getEventParticipants() {
        const query = `
            SELECT Users.UserID, Users.FullName 
            FROM EventParticipants
            INNER JOIN Users ON EventParticipants.UserID = Users.UserID
            WHERE EventParticipants.EventID = ?`;
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                this.participants = results; // Store the participants
                resolve(this.participants);
            });
        });
    }

    // Static method to create a new event
    static async createEvent(name, description, date, time, location, userId) { // Changed 'title' to 'name'
        const query = "INSERT INTO Events (Title, Description, Date, Time, Location, UserID) VALUES (?, ?, ?, ?, ?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [name, description, date, time, location, userId], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId); // Resolve with the new event's ID
            });
        });
    }

    // Update an existing event
    async updateEvent(name, description, date, time, location) {
        const query = "UPDATE Events SET Title = ?, Description = ?, Date = ?, Time = ?, Location = ? WHERE EventID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [name, description, date, time, location, this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if updated, false otherwise
            });
        });
    }

    // Delete an event
    async deleteEvent() {
        const query = "DELETE FROM Events WHERE EventID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if deleted, false otherwise
            });
        });
    }

    // Add a participant to the event
    async addParticipant(userId) {
        const query = "INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [userId, this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if added, false otherwise
            });
        });
    }

    // Remove a participant from the event
    async removeParticipant(userId) {
        const query = "DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [userId, this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if removed, false otherwise
            });
        });
    }
}

module.exports = { Event };