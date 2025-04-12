const db = require("../services/db"); // Import database connection

// UserCourse model to handle user-course relationships
// This model will manage the many-to-many relationship between users and courses
class UserCourse {
    constructor(userId, courseId) {
        this.userId = userId;
        this.courseId = courseId;
    }

    // Fetch courses for a specific user
    // This method retrieves all courses associated with a given user ID
    // It uses an INNER JOIN to combine data from UserCourses and Courses tables
    static async getCoursesByUserId(userId) {
        const query = `
            SELECT Courses.CourseID, Courses.CourseName 
            FROM UserCourses
            INNER JOIN Courses ON UserCourses.CourseID = Courses.CourseID
            WHERE UserCourses.UserID = ?`;
        try {
            const results = await db.query(query, [userId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching courses for user:", err);
            throw err;
        }
    }

    // Fetch users enrolled in a specific course
    // This method retrieves all users associated with a given course ID
    // It uses an INNER JOIN to combine data from UserCourses and Users tables
    static async getUsersByCourseId(courseId) {
        const query = `
            SELECT Users.UserID, Users.FullName 
            FROM UserCourses
            INNER JOIN Users ON UserCourses.UserID = Users.UserID
            WHERE UserCourses.CourseID = ?`;
        try {
            const results = await db.query(query, [courseId]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error fetching users for course:", err);
            throw err;
        }
    }

    // Enroll a user in a course
    // This method inserts a new record into the UserCourses table
    // It associates the user ID with the course ID
    async enrollUserInCourse() {
        const query = "INSERT INTO UserCourses (UserID, CourseID) VALUES (?, ?)";
        try {
            const results = await db.query(query, [this.userId, this.courseId]);
            return { message: "User enrolled successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error enrolling user in course:", err);
            throw err;
        }
    }

    // Remove a user from a course
    // This method deletes the record from the UserCourses table
    // It disassociates the user ID from the course ID
    static async removeUserFromCourse(userId, courseId) {
        const query = "DELETE FROM UserCourses WHERE UserID = ? AND CourseID = ?";
        try {
            const results = await db.query(query, [userId, courseId]);
            return { message: "User removed from course successfully" };
        } catch (err) {
            console.error("Error removing user from course:", err);
            throw err;
        }
    }
}

module.exports = { UserCourse };
