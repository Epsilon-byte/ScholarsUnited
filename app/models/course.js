const db = require("../services/db"); // Import database connection

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
          console.error("Error fetching all courses:", err);
          throw err;
        }
      }

    // Adds a new course
    static async addCourse(courseName) {
        const query = "INSERT INTO Courses (CourseName) VALUES (?)";
        try {
            const results = await db.query(query, [courseName]);
            return { message: "Course added successfully", insertedId: results.insertId };
        } catch (err) {
            console.error("Error adding course:", err);
            throw err;
        }
    }

    // Deletes a course by ID
    static async deleteCourse(courseId) {
        const query = "DELETE FROM Courses WHERE CourseID = ?";
        try {
            const results = await db.query(query, [courseId]);
            return { message: "Course deleted successfully" };
        } catch (err) {
            console.error("Error deleting course:", err);
            throw err;
        }
    }
}

module.exports = { Course };
