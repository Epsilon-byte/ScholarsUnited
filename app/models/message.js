const db = require("../services/db"); // Import database connection

class Message {
    constructor(id) {
        this.id = id;
        this.senderId = null;
        this.receiverId = null;
        this.content = null;
        this.timestamp = null;
    }

    // Fetch message details
    async getMessageDetails() {
        const query = "SELECT * FROM Messages WHERE MessageID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                if (results.length > 0) {
                    this.senderId = results[0].SenderID;
                    this.receiverId = results[0].ReceiverID;
                    this.content = results[0].Content;
                    this.timestamp = results[0].Timestamp;
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Get sender details (you can add a similar method for receiver details)
    async getSenderDetails() {
        const query = "SELECT * FROM Users WHERE UserID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.senderId], (err, results) => {
                if (err) reject(err);
                if (results.length > 0) {
                    resolve(results[0]); // Resolve with sender details
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Static method to create a new message
    static async createMessage(senderId, receiverId, content) {
        const query = "INSERT INTO Messages (SenderID, ReceiverID, Content) VALUES (?, ?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [senderId, receiverId, content], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId); // Resolve with the ID of the new message
            });
        });
    }

    // Add other methods as needed (e.g., updateMessage, deleteMessage)
}

module.exports = { Message };