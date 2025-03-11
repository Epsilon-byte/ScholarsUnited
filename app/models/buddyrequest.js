const db = require("../services/db"); // Import database connection

class BuddyRequest {
    constructor(id) {
        this.id = id;
        this.senderId = null;
        this.receiverId = null;
        this.status = null;
    }

    // Fetch buddy request details
    async getRequestDetails() {
        const query = "SELECT * FROM BuddyRequests WHERE RequestID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                if (results.length > 0) {
                    this.senderId = results[0].SenderID;
                    this.receiverId = results[0].ReceiverID;
                    this.status = results[0].Status;
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

    // Static method to create a new buddy request
    static async createBuddyRequest(senderId, receiverId) {
        const query = "INSERT INTO BuddyRequests (SenderID, ReceiverID) VALUES (?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [senderId, receiverId], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId); // Resolve with the new request's ID
            });
        });
    }

    // Static method to update the status of a buddy request
    static async updateBuddyRequestStatus(requestId, status) {
        const query = "UPDATE BuddyRequests SET Status = ? WHERE RequestID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [status, requestId], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if updated, false otherwise
            });
        });
    }

    // Add other methods as needed (e.g., deleteRequest)
}

module.exports = { BuddyRequest };