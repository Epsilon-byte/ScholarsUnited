const db = require("../services/db"); // Import database connection

class Message {
    constructor(senderId, receiverId, content) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = null;
        this.id = null; // Will be set after insertion
    }

    // Instance method: send the message
    async sendMessage() {
        const query = "INSERT INTO Messages (SenderID, ReceiverID, Content) VALUES (?, ?, ?)";
        try {
            const [results] = await db.query(query, [this.senderId, this.receiverId, this.content]);
            this.id = results.insertId;
            this.timestamp = new Date(); // Optional: for local use
            return { message: "Message sent successfully", insertedId: this.id };
        } catch (err) {
            console.error("Error sending message:", err);
            throw err;
        }
    }

    // Static method: fetch all messages for a user
    // In Message model (e.g., models/Message.js)
static async getMessages(userId) {
    const query = `
        SELECT 
        Messages.MessageID,
        Messages.Content,
        Messages.Timestamp,
        Messages.SenderID,
        Messages.ReceiverID,
        Sender.FullName AS SenderName,
        Receiver.FullName AS ReceiverName
        FROM Messages
        INNER JOIN Users AS Sender ON Messages.SenderID = Sender.UserID
        INNER JOIN Users AS Receiver ON Messages.ReceiverID = Receiver.UserID
        WHERE Messages.SenderID = ? OR Messages.ReceiverID = ?
        ORDER BY Messages.Timestamp DESC
    `;
    try {
        const [results] = await db.query(query, [userId, userId]);
        return results || [];
    } catch (err) {
        console.error("Error fetching messages:", err);
        throw err;
    }
}

    // Fetch details of a specific message
    async getMessageDetails() {
        const query = "SELECT * FROM Messages WHERE MessageID = ?";
        try {
            const [results] = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null;

            const message = results[0];
            this.senderId = message.SenderID;
            this.receiverId = message.ReceiverID;
            this.content = message.Content;
            this.timestamp = message.Timestamp;
            return message;
        } catch (err) {
            console.error("Error fetching message details:", err);
            throw err;
        }
    }

    // Fetch sender details
    async getSenderDetails() {
        const query = "SELECT UserID, FullName, Email FROM Users WHERE UserID = ?";
        try {
            const [results] = await db.query(query, [this.senderId]);
            return results.length > 0 ? results[0] : null;
        } catch (err) {
            console.error("Error fetching sender details:", err);
            throw err;
        }
    }

    // Static version (optional) - create message without instance
    static async createMessage(senderId, receiverId, content) {
        const query = "INSERT INTO Messages (SenderID, ReceiverID, Content) VALUES (?, ?, ?)";
        try {
            const [results] = await db.query(query, [senderId, receiverId, content]);
            return { message: "Message sent successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error creating message:", err);
            throw err;
        }
    }

    // Update an existing message
    async updateMessage(newContent) {
        const query = "UPDATE Messages SET Content = ? WHERE MessageID = ?";
        try {
            const [results] = await db.query(query, [newContent, this.id]);
            return results.affectedRows > 0 ? { message: "Message updated successfully" } : null;
        } catch (err) {
            console.error("Error updating message:", err);
            throw err;
        }
    }

    // Delete a message
    async deleteMessage() {
        const query = "DELETE FROM Messages WHERE MessageID = ?";
        try {
            const [results] = await db.query(query, [this.id]);
            return results.affectedRows > 0 ? { message: "Message deleted successfully" } : null;
        } catch (err) {
            console.error("Error deleting message:", err);
            throw err;
        }
    }
}

module.exports = { Message };
