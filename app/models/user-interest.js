const db = require("../services/db");

// UserInterest class to manage user interests
// This class provides methods to add, remove, and fetch user interests
class UserInterest {
    constructor(userId) {
        this.userId = userId;
        this.interests = [];
    }

    // Fetch interests for a specific user 
    // This method retrieves all interests associated with the given user ID
    // It returns an array of interests or an empty array if none are found
    static async getInterestsByUserId(userId) {
        const query = `
            SELECT Interests.InterestName 
            FROM UserInterests
            INNER JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE UserInterests.UserID = ?`;
        try {
            const results = await db.query(query, [userId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching user interests:", err);
            throw err;
        }
    }

    // Add a new interest for a user
    // This method inserts a new record into the UserInterests table
    // It takes the user ID and interest ID as parameters
    static async addInterest(userId, interestId) {
        const query = "INSERT INTO UserInterests (UserID, InterestID) VALUES (?, ?)";
        try {
            const results = await db.query(query, [userId, interestId]);
            return { message: "Interest added successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error adding interest:", err);
            throw err;
        }
    }
    
    // Remove a specific interest for a user
    // This method deletes a record from the UserInterests table
    // It takes the user ID and interest ID as parameters
    static async removeInterest(userId, interestId) {
        const query = "DELETE FROM UserInterests WHERE UserID = ? AND InterestID = ?";
        try {
            await db.query(query, [userId, interestId]);
            return { message: "Interest removed successfully" };
        } catch (err) {
            console.error("Error removing interest:", err);
            throw err;
        }
    }

    // Fetch all users with a specific interest
    // This method retrieves all users associated with a given interest ID
    // It returns an array of users or an empty array if none are found
    static async getUsersByInterest(interestId) {
        const query = `
            SELECT Users.UserID, Users.FullName, Users.Email 
            FROM UserInterests
            INNER JOIN Users ON UserInterests.UserID = Users.UserID
            WHERE UserInterests.InterestID = ?`;
        try {
            const results = await db.query(query, [interestId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching users by interest:", err);
            throw err;
        }
    }
}

module.exports = { UserInterest };
