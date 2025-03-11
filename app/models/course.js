const db = require("../services/db");

class Course {
    constructor(id) {
        this.id = id;
        this.name = null;
    }

    // Fetch course details
    async getCourseDetails() {
        const query = "SELECT * FROM Courses WHERE CourseID = ?";
        return new Promise((resolve, reject) => {
            db.query(query, [this.id], (err, results) => {
                if (err) reject(err);
                if (results.length > 0) {
                    this.name = results[0].CourseName;
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            });
        });
    }
}

module.exports = { Course };
