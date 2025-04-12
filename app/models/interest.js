const db = require("../services/db"); // Import database connection

// Interest model class
// This class handles operations related to interests in the database
class Interest {
    constructor(id) {
        this.id = id;
        this.name = null;
    }

    // Fetches interest details by InterestID
    // This method retrieves the interest name and other details based on the provided ID
    // It returns the interest object if found, otherwise null
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
    // This method retrieves all interests from the database
    // It returns an array of interest objects if found, otherwise an empty array
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
    // This method inserts a new interest into the database
    // It returns a success message and the ID of the inserted interest
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
    // This method removes an interest from the database based on the provided ID
    // It returns a success message if the deletion is successful
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
