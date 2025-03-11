const db = require("../services/db"); // Import database connection

class Notification {
    constructor(id) {
        this.id = id;
        this.userId = null;
        this.message = null;
        this.timestamp = null;
    }

    // Fetch notification details
    async getNotificationDetails() {
        const query = "SELECT * FROM Notifications WHERE NotificationID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                if (results.length > 0) {
                    this.userId = results[0].UserID;
                    this.message = results[0].Message;
                    this.timestamp = results[0].Timestamp;
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Static method to create a new notification
    static async createNotification(userId, message) {
        const query = "INSERT INTO Notifications (UserID, Message) VALUES (?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [userId, message], (err, results) => {
                if (err) reject(err);
                resolve(results.insertId); // Resolve with the new notification's ID
            });
        });
    }

    // Mark a notification as read
    async markAsRead() {
        // Assuming you have a 'Read' column in the Notifications table (boolean)
        const query = "UPDATE Notifications SET Read = true WHERE NotificationID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if updated, false otherwise
            });
        });
    }

    // Delete a notification
    async deleteNotification() {
        const query = "DELETE FROM Notifications WHERE NotificationID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                resolve(results.affectedRows > 0); // Resolve with true if deleted, false otherwise
            });
        });
    }
}

module.exports = { Notification };