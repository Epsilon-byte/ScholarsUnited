const db = require("../services/db"); // Import database connection

class Interest {
    constructor(id) {
        this.id = id;
        this.name = null;
    }

    // Fetches interest details by InterestID
    async getInterestDetails() {
        const query = "SELECT * FROM Interests WHERE InterestID = ?";
        try {
            const results = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null;

            this.name = results[0].InterestName;
            return results[0];
        } catch (err) {
            console.error("Error fetching interest details:", err);
            throw err;
        }
    }

    // Fetches all interests
    static async getAllInterests() {
        const query = "SELECT * FROM Interests";
        try {
            const results = await db.query(query);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching all interests:", err);
            throw err;
        }
    }

    // Add a new interest
    static async addInterest(interestName) {
        const query = "INSERT INTO Interests (InterestName) VALUES (?)";
        try {
            const results = await db.query(query, [interestName]);
            return { message: "Interest added successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error adding interest:", err);
            throw err;
        }
    }

    // Delete an interest by ID
    static async deleteInterest(interestId) {
        const query = "DELETE FROM Interests WHERE InterestID = ?";
        try {
            const results = await db.query(query, [interestId]);
            return { message: "Interest deleted successfully" };
        } catch (err) {
            console.error("Error deleting interest:", err);
            throw err;
        }
    }
}

module.exports = { Interest };
