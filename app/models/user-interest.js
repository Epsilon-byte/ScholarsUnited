const db = require("../services/db");

class UserInterest {
    constructor(userId) {
        this.userId = userId;
        this.interests = [];
    }

    // Fetch interests for a specific user
    async getInterests() {
        const query = `
            SELECT Interests.InterestName 
            FROM UserInterests
            INNER JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE UserInterests.UserID = ?`;
        return new Promise((resolve, reject) => {
            db.query(query, [this.userId], (err, results) => {
                if (err) reject(err);
                this.interests = results.map((row) => row.InterestName);
                resolve(this.interests);
            });
        });
    }
}

module.exports = { UserInterest };
