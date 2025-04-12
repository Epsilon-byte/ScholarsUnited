const db = require("../services/db"); // Import database connection

// Message model class
// This class handles operations related to messages in the database
// It includes methods for sending, fetching, updating, and deleting messages
class Message {
    constructor(senderId, receiverId, content) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = null;
        this.id = null; // Will be set after insertion
    }

    // Instance method: send the message
    // This method inserts a new message into the database
    // It returns a success message and the ID of the inserted message
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

    // Fetch all messages for a user
    // This method retrieves all messages sent or received by the user
    // It returns an array of message objects if found, otherwise an empty array
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
    // This method retrieves the message details based on the MessageID
    // It returns the message object if found, otherwise null
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
    // This method retrieves the sender's details based on the SenderID
    // It returns the sender object if found, otherwise null
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

    // Fetch receiver details
    // This method retrieves the receiver's details based on the ReceiverID
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
    // This method modifies the content of a message based on the MessageID
    // It returns a success message if the update is successful
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
    // This method removes a message from the database based on the MessageID
    // It returns a success message if the deletion is successful
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
