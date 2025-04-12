const db = require("../services/db"); // Import database connection

class EventMessage {
    constructor(senderId, eventId, content) {
        this.senderId = senderId;
        this.eventId = eventId;
        this.content = content;
        this.timestamp = null;
        this.id = null; // Will be set after insertion
    }

    // Send a message to an event chat
    async sendMessage() {
        const query = "INSERT INTO EventMessages (SenderID, EventID, Content) VALUES (?, ?, ?)";
        try {
            const [results] = await db.query(query, [this.senderId, this.eventId, this.content]);
            this.id = results.insertId;
            this.timestamp = new Date(); // For local use
            return { 
                success: true, 
                message: "Message sent successfully", 
                insertedId: this.id 
            };
        } catch (err) {
            console.error("Error sending event message:", err);
            throw err;
        }
    }

    // Static method to create a message without instantiating
    static async createMessage(senderId, eventId, content) {
        const query = "INSERT INTO EventMessages (SenderID, EventID, Content) VALUES (?, ?, ?)";
        try {
            const [results] = await db.query(query, [senderId, eventId, content]);
            return { 
                success: true, 
                message: "Message sent successfully", 
                insertedId: results.insertId 
            };
        } catch (err) {
            console.error("Error creating event message:", err);
            throw err;
        }
    }

    // Get all messages for an event
    static async getEventMessages(eventId) {
        const query = `
            SELECT 
                EventMessages.MessageID,
                EventMessages.Content,
                EventMessages.Timestamp,
                EventMessages.SenderID,
                EventMessages.EventID,
                Users.FullName AS SenderName
            FROM EventMessages
            INNER JOIN Users ON EventMessages.SenderID = Users.UserID
            WHERE EventMessages.EventID = ?
            ORDER BY EventMessages.Timestamp ASC
        `;
        try {
            const [results] = await db.query(query, [eventId]);
            return results || [];
        } catch (err) {
            console.error("Error fetching event messages:", err);
            throw err;
        }
    }

    // Check if a user is allowed to send messages to an event
    static async canUserSendMessage(userId, eventId) {
        // Check if user is a participant in the event
        const query = "SELECT * FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        try {
            const [results] = await db.query(query, [userId, eventId]);
            return results.length > 0;
        } catch (err) {
            console.error("Error checking message permission:", err);
            throw err;
        }
    }

    // Delete a message
    async deleteMessage() {
        const query = "DELETE FROM EventMessages WHERE MessageID = ?";
        try {
            const [results] = await db.query(query, [this.id]);
            return { 
                success: results.affectedRows > 0, 
                message: results.affectedRows > 0 ? "Message deleted successfully" : "Message not found" 
            };
        } catch (err) {
            console.error("Error deleting event message:", err);
            throw err;
        }
    }
}

module.exports = { EventMessage };
