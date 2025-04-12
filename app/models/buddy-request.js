const db = require("../services/db"); // Import database connection

// BuddyRequest class to handle buddy request operations
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
        try {
            const results = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null;

            const request = results[0];
            this.senderId = request.SenderID;
            this.receiverId = request.ReceiverID;
            this.status = request.Status;
            return request;
        } catch (err) {
            console.error("Error fetching buddy request details:", err);
            throw err;
        }
    }

    // Fetch sender details
    async getSenderDetails() {
        const query = "SELECT UserID, FullName, Email FROM Users WHERE UserID = ?";
        try {
            const results = await db.query(query, [this.senderId]);
            return results.length > 0 ? results[0] : null;
        } catch (err) {
            console.error("Error fetching sender details:", err);
            throw err;
        }
    }

    // Create a new buddy request
    static async createBuddyRequest(senderId, receiverId) {
        const query = "INSERT INTO BuddyRequests (SenderID, ReceiverID, Status) VALUES (?, ?, 'Pending')";
        try {
            const results = await db.query(query, [senderId, receiverId]);
            return { message: "Buddy request sent successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error creating buddy request:", err);
            throw err;
        }
    }

    // Update the status of a buddy request
    static async updateBuddyRequestStatus(requestId, status) {
        const query = "UPDATE BuddyRequests SET Status = ? WHERE RequestID = ?";
        try {
            const results = await db.query(query, [status, requestId]);
            return results.affectedRows > 0 ? { message: "Buddy request status updated successfully" } : null;
        } catch (err) {
            console.error("Error updating buddy request status:", err);
            throw err;
        }
    }

    // Fetch all buddy requests sent by a user
    static async getSentRequests(userId) {
        const query = "SELECT * FROM BuddyRequests WHERE SenderID = ?";
        try {
            const results = await db.query(query, [userId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching sent buddy requests:", err);
            throw err;
        }
    }

    // Fetch all buddy requests received by a user
    static async getReceivedRequests(userId) {
        const query = "SELECT * FROM BuddyRequests WHERE ReceiverID = ?";
        try {
            const results = await db.query(query, [userId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching received buddy requests:", err);
            throw err;
        }
    }

    // Delete a buddy request
    async deleteRequest() {
        const query = "DELETE FROM BuddyRequests WHERE RequestID = ?";
        try {
            const results = await db.query(query, [this.id]);
            return results.affectedRows > 0 ? { message: "Buddy request deleted successfully" } : null;
        } catch (err) {
            console.error("Error deleting buddy request:", err);
            throw err;
        }
    }
}

module.exports = { BuddyRequest };
