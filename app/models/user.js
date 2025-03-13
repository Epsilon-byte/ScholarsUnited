const db = require("../services/db"); // Import database connection

class User {
    constructor(id) {
        this.id = id;
        this.fullName = null;
        this.email = null;
        this.interests = [];
        this.hobbies = null;
        this.academicInfo = null;
        this.availableTime = null;
    }

    // Fetch user details
    async getUserDetails() {
        const query = "SELECT * FROM Users WHERE UserID = ?";
        try {
            const results = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null; // No user found

            const user = results[0]; // Get the first user (assuming unique UserID)
            this.fullName = user.FullName;
            this.email = user.Email;
            this.hobbies = user.Hobbies;
            this.academicInfo = user.AcademicInfo;
            this.availableTime = user.AvailableTime;

            return user;
        } catch (err) {
            console.error("Error fetching user details:", err);
            throw err; // Rethrow error for handling in routes
        }
    }

    // Fetch user interests
    async getUserInterests() {
        const query = `
            SELECT Interests.InterestName 
            FROM UserInterests
            INNER JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE UserInterests.UserID = ?`;
        try {
            const results = await db.query(query, [this.id]);
            this.interests = results.map(row => row.InterestName);
            return this.interests;
        } catch (err) {
            console.error("Error fetching user interests:", err);
            throw err;
        }
    }

    // Delete a user account
    static async deleteUser(userId) {
        const query = "DELETE FROM Users WHERE UserID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [userId], (err, results) => {
                if (err) reject(err);
                else resolve({ message: `User ${userId} deleted successfully.` });
            });
        });
    }

    // Search users by name, interests, or availability
    static async searchUsers(query) {
        const sql = `
            SELECT DISTINCT Users.UserID, Users.FullName, Users.Email, Users.AvailableTime
            FROM Users
            LEFT JOIN UserInterests ON Users.UserID = UserInterests.UserID
            LEFT JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE Users.FullName LIKE ? OR Interests.InterestName LIKE ? OR Users.AvailableTime LIKE ?
            LIMIT 20`; // Limit results to 20 for efficiency
        
        const searchQuery = `%${query}%`;
        return new Promise((resolve, reject) => {
            db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }
}

module.exports = { User };
