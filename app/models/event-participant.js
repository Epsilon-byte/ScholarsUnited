const db = require("../services/db"); // Import database connection from services folder

// EventParticipant class to handle event participant operations
// This class is responsible for checking if a user is participating in an event, adding a participant, and removing a participant from an event.
class EventParticipant {
    constructor(userId, eventId) {
        this.userId = userId;
        this.eventId = eventId;
    }

    // Checks if a user is participating in an event
    async isParticipating() {
        const query = "SELECT * FROM EventParticipants WHERE UserID = ? AND EventID = ?"; // SQL query to check if the user is already a participant
        // The userId and eventId are passed as parameters to prevent SQL injection attacks
        return new Promise((resolve, reject) => {
            db.query(query, [this.userId, this.eventId], (err, results) => { // Executes the query with the userId and eventId parameters
                if (err) reject(err);
                resolve(results.length > 0); // Resolves with true if participating, false otherwise
            });
        });
    }

    // Fetches all participants for a specific event
    static async addParticipant(userId, eventId) {
        const query = "INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)"; // SQL query to insert a new participant
        // The userId and eventId are passed as parameters to prevent SQL injection attacks
        return new Promise((resolve, reject) => {
            console.log("🔄 Attempting to add participant:", { userId, eventId }); // 💡 Log the attempt to add a participant
    
            db.query(query, [userId, eventId], (err, results) => { // Executes the query with the userId and eventId parameters
                if (err) {
                    console.error("❌ DB insert error:", err); // 💡 Log DB error if any
                    return reject(err);
                }
    
                console.log("✅ Insert result:", results); // 💡 Log what happened
                resolve(results.affectedRows > 0);
            });
        });
    }
    

    // Static method to remove a participant from an event
    static async removeParticipant(userId, eventId) {
        const query = "DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?"; // SQL query to delete a participant
        // The userId and eventId are passed as parameters to prevent SQL injection attacks
        return new Promise((resolve, reject) => { 
            db.query(query, [userId, eventId], (err, results) => { // Executes the query with the userId and eventId parameters
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolves with true if removed, false otherwise
            });
        });
    }
}

module.exports = { EventParticipant };