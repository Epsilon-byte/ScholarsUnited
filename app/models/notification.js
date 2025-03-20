const db = require("../services/db"); // Import database connection

class Notification {
    constructor(id) {
        this.id = id;
        this.userId = null;
        this.message = null;
        this.timestamp = null;
        this.read = false; // Add a 'read' property
    }

    // Fetch notification details
    async getNotificationDetails() {
        const query = "SELECT * FROM Notifications WHERE NotificationID = ?";
        try {
            const [results] = await db.query(query, [this.id]);
            if (results.length > 0) {
                this.userId = results[0].UserID;
                this.message = results[0].Message;
                this.timestamp = results[0].Timestamp;
                this.read = results[0].Read; // Fetch the 'read' status
                return results[0];
            }
            return null;
        } catch (err) {
            console.error("Error fetching notification details:", err);
            throw err;
        }
    }

    // Static method to create a new notification
    static async createNotification(userId, message) {
        const query = "INSERT INTO Notifications (UserID, Message) VALUES (?, ?)";
        try {
            const [results] = await db.query(query, [userId, message]);
            return results.insertId; // Return the new notification's ID
        } catch (err) {
            console.error("Error creating notification:", err);
            throw err;
        }
    }

    // Mark a notification as read
    async markAsRead() {
        const query = "UPDATE Notifications SET `Read` = 1 WHERE NotificationID = ?";
        try {
          const [results] = await db.query(query, [this.id]);
          return results.affectedRows > 0; // Return true if updated, false otherwise
        } catch (err) {
          console.error("Error marking notification as read:", err);
          throw err;
        }
      }

    // Delete a notification
    async deleteNotification() {
        const query = "DELETE FROM Notifications WHERE NotificationID = ?";
        try {
            const [results] = await db.query(query, [this.id]);
            return results.affectedRows > 0; // Return true if deleted, false otherwise
        } catch (err) {
            console.error("Error deleting notification:", err);
            throw err;
        }
    }

    // Fetch all notifications for a user
    static async getNotificationsByUserId(userId) {
        const query = `
          SELECT 
            Notifications.NotificationID, 
            Notifications.Message, 
            Notifications.Timestamp, 
            Notifications.ReadNotif, 
            Users.FullName, 
            Users.Email
          FROM Notifications
          INNER JOIN Users ON Users.UserID = Notifications.UserID
          WHERE Notifications.UserID = ?
          ORDER BY Notifications.Timestamp DESC`;
        try {
          const [results] = await db.query(query, [userId]);
          return results;
        } catch (err) {
          console.error("Error fetching notifications by user ID:", err);
          throw err;
        }
      }
}

module.exports = { Notification };