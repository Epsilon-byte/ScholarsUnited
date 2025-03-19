const db = require("../services/db"); // Import database connection

class User {
    constructor(id) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.interests = [];
        this.hobbies = null;
        this.academicInfo = null;
        this.availableTime = null;
    }

    // Fetch user details by ID
    async getUserDetails() {
        const query = "SELECT * FROM Users WHERE UserID = ?";
        try {
            const results = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null;

            const user = results[0];
            this.fullName = user.FullName;
            this.email = user.Email;
            this.hobbies = user.Hobbies;
            this.academicInfo = user.AcademicInfo;
            this.availableTime = user.AvailableTime;
            return user;
        } catch (err) {
            console.error("Error fetching user details:", err);
            throw err;
        }
    }

    // Fetch user by email (for login authentication)
    static async findByEmail(email) {
        const query = "SELECT * FROM Users WHERE Email = ?";
        try {
          const [results] = await db.query(query, [email]);
          return results[0] || null; // Return the first user or null if not found
        } catch (err) {
          console.error("Error finding user by email:", err);
          throw err;
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
        try {
            const results = await db.query(query, [userId]);
            return { message: `User ${userId} deleted successfully.` };
        } catch (err) {
            console.error("Error deleting user:", err);
            throw err;
        }
    }

    // Search users by name, interests, or availability
    static async searchUsers(query) {
        const sql = `
            SELECT DISTINCT Users.UserID, Users.FullName, Users.Email, Users.AvailableTime
            FROM Users
            LEFT JOIN UserInterests ON Users.UserID = UserInterests.UserID
            LEFT JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE Users.FullName LIKE ? OR Interests.InterestName LIKE ? OR Users.AvailableTime LIKE ?
            LIMIT 20`;
        const searchQuery = `%${query}%`;
        try {
            const results = await db.query(sql, [searchQuery, searchQuery, searchQuery]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error searching users:", err);
            throw err;
        }
    }
}

module.exports = { User };
