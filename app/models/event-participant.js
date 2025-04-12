const db = require("../services/db"); // Import database connection from services folder

class EventParticipant {
    constructor(userId, eventId) {
        this.userId = userId;
        this.eventId = eventId;
    }

    // Checks if a user is participating in an event
    static async isParticipating(userId, eventId) {
        const query = "SELECT * FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        try {
            const [results] = await db.query(query, [userId, eventId]);
            return results.length > 0; // Returns true if participating, false otherwise
        } catch (err) {
            console.error("Error checking participation:", err);
            throw err;
        }
    }

    static async addParticipant(userId, eventId) {
        // First check if already participating
        try {
            const alreadyParticipating = await this.isParticipating(userId, eventId);
            if (alreadyParticipating) {
                return { success: true, message: "Already participating in this event" };
            }
            
            // If not participating, add them
            const query = "INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)";
            const [results] = await db.query(query, [userId, eventId]);
            
            return { 
                success: results.affectedRows > 0,
                message: results.affectedRows > 0 ? "Successfully joined event" : "Failed to join event"
            };
        } catch (err) {
            console.error("Error adding participant:", err);
            throw err;
        }
    }
    
    // Static method to remove a participant from an event
    static async removeParticipant(userId, eventId) {
        const query = "DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        try {
            const [results] = await db.query(query, [userId, eventId]);
            return { 
                success: results.affectedRows > 0,
                message: results.affectedRows > 0 ? "Successfully left event" : "Not participating in this event"
            };
        } catch (err) {
            console.error("Error removing participant:", err);
            throw err;
        }
    }
    
    // Get all participants for an event
    static async getEventParticipants(eventId) {
        const query = `
            SELECT Users.UserID, Users.FullName, Users.Email 
            FROM EventParticipants
            INNER JOIN Users ON EventParticipants.UserID = Users.UserID
            WHERE EventParticipants.EventID = ?`;
        try {
            const [results] = await db.query(query, [eventId]);
            return results || [];
        } catch (err) {
            console.error("Error fetching participants:", err);
            throw err;
        }
    }
    
    // Get all events a user is participating in
    static async getUserEvents(userId) {
        const query = `
            SELECT Events.* 
            FROM EventParticipants
            INNER JOIN Events ON EventParticipants.EventID = Events.EventID
            WHERE EventParticipants.UserID = ?`;
        try {
            const [results] = await db.query(query, [userId]);
            return results || [];
        } catch (err) {
            console.error("Error fetching user events:", err);
            throw err;
        }
    }
}

module.exports = { EventParticipant };