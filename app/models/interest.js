const db = require("../services/db"); // Import the database connection

class Interest {
    constructor(id) {
        this.id = id;
        this.name = null;
    }

    // Fetch interest details by InterestID
    async getInterestDetails() {
        const query = "SELECT * FROM Interests WHERE InterestID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) {
                    reject(err);
                } else if (results.length > 0) {
                    this.name = results[0].InterestName;
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Fetch all interests
    static async getAllInterests() {
        const query = "SELECT * FROM Interests";
        return new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = { Interest };