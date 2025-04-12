const db = require("../services/db"); // Import database connection

// Course class to handle course operations
// This class is responsible for fetching course details, adding new courses, and deleting courses.
// It interacts with the database to perform these operations and handles errors appropriately.
class Course {
    constructor(id) {
        this.id = id;
        this.name = null;
    }

    // Fetches course details by CourseID
    async getCourseDetails() {
        const query = "SELECT * FROM Courses WHERE CourseID = ?";
        try {
            const results = await db.query(query, [this.id]);
            if (!results || results.length === 0) return null;

            this.name = results[0].CourseName;
            return results[0];
        } catch (err) {
            console.error("Error fetching course details:", err);
            throw err;
        }
    }

    // Fetches all courses
    static async getAllCourses() {
        const query = "SELECT CourseID, CourseName FROM Courses";
        try {
          const [results] = await db.query(query); // Destructures the array to get only the rows
          return results || []; // Returns an array, even if empty
        } catch (err) {
          console.error("Error fetching all courses:", err); // Logs the error for debugging
          throw err;
        }
      }

    // Adds a new course
    static async addCourse(courseName) {
        const query = "INSERT INTO Courses (CourseName) VALUES (?)"; // SQL query to insert a new course
        // The courseName is passed as a parameter to prevent SQL injection attacks
        try {
            const results = await db.query(query, [courseName]); // Executes the query with the courseName parameter
            return { message: "Course added successfully", insertedId: results.insertId }; // Returns a success message and the ID of the newly inserted course
        } catch (err) {
            console.error("Error adding course:", err);
            throw err;
        }
    }

    // Deletes a course by ID
    static async deleteCourse(courseId) {
        const query = "DELETE FROM Courses WHERE CourseID = ?"; // SQL query to delete a course by its ID
        // The courseId is passed as a parameter to prevent SQL injection attacks
        try {
            const results = await db.query(query, [courseId]); // Executes the query with the courseId parameter
            return { message: "Course deleted successfully" }; // Returns a success message
        } catch (err) {
            console.error("Error deleting course:", err); // Logs the error for debugging
            throw err;
        }
    }
}

module.exports = { Course };
