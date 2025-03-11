const db = require("../services/db"); // Import database connection

class UserCourse {
    constructor(userId, courseId) {
        this.userId = userId;
        this.courseId = courseId;
    }

    // Fetch courses for a specific user
    static async getCoursesByUserId(userId) {
        const query = `
            SELECT Courses.CourseID, Courses.CourseName 
            FROM UserCourses
            INNER JOIN Courses ON UserCourses.CourseID = Courses.CourseID
            WHERE UserCourses.UserID = ?`;
        return new Promise((resolve, reject) => {
            db.query(query, [userId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    // Fetch users enrolled in a specific course
    static async getUsersByCourseId(courseId) {
        const query = `
            SELECT Users.UserID, Users.FullName 
            FROM UserCourses
            INNER JOIN Users ON UserCourses.UserID = Users.UserID
            WHERE UserCourses.CourseID = ?`;
        return new Promise((resolve, reject) => {
            db.query(query, [courseId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    // Enroll a user in a course
    async enrollUserInCourse() {
        const query = "INSERT INTO UserCourses (UserID, CourseID) VALUES (?, ?)";
        return new Promise((resolve, reject) => {
            db.query(query, [this.userId, this.courseId], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = { UserCourse };
