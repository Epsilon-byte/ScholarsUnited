const db = require("../services/db"); // Import database connection from services folder

class EventParticipant {
    constructor(userId, eventId) {
        this.userId = userId;
        this.eventId = eventId;
    }

    // Checks if a user is participating in an event
    async isParticipating() {
        const query = "SELECT * FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.userId, this.eventId], (err, results) => {
                if (err) reject(err);
                resolve(results.length > 0); // Resolves with true if participating, false otherwise
            });
        });
    }

    // Static method to add a participant to an event
    static async addParticipant(userId, eventId) {
        const query = "INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [userId, eventId], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolves with true if added, false otherwise
            });
        });
    }

    // Static method to remove a participant from an event
    static async removeParticipant(userId, eventId) {
        const query = "DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [userId, eventId], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolves with true if removed, false otherwise
            });
        });
    }
}

module.exports = { EventParticipant };