const db = require("../services/db"); // Import database connection
const bcrypt = require('bcryptjs');

// User class to manage user-related operations
// This class provides methods for user registration, fetching user details, and searching users
class User {
    constructor(id) {
        this.id = id;
        this.fullName = null;
        this.email = null;
        this.interests = null; // Will be set to an array or string
        this.hobbies = null;
        this.academicInfo = null;
        this.availableTime = null;
    }

    // Register a new user
    // This method inserts a new user into the Users table
    static async register({ email, password, fullName, interests, hobbies, academicInfo, availableTime }) {
        try {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new Error('Email already in use');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await db.query(
                `INSERT INTO Users 
                (Email, Password, FullName, Interests, Hobbies, AcademicInfo, AvailableTime) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, fullName, interests, hobbies, academicInfo, availableTime]
            );

            if (!result.insertId) {
                throw new Error('Failed to create user');
            }

            return {
                id: result.insertId,
                email,
                fullName
            };
        } catch (err) {
            console.error("Registration error:", err);
            throw err;
        }
    }

    // Fetch user details
    // This method retrieves user details from the database using the user ID
    // It returns the user object or null if not found
    async getUserDetails() {
        const query = "SELECT * FROM Users WHERE UserID = ?";
        try {
            const [results] = await db.query(query, [this.id]); // ✅ Destructure properly
            if (!results || results.length === 0) return null;

            const user = results[0];

            this.fullName = user.FullName;
            this.email = user.Email;
            this.interests = user.Interests;
            this.hobbies = user.Hobbies;
            this.academicInfo = user.AcademicInfo;
            this.availableTime = user.AvailableTime;

            return user;
        } catch (err) {
            console.error("Error fetching user details:", err);
            throw err;
        }
    }

    // Retrieve user interests
    // This method fetches the user's interests from the database
    async getUserInterests() {
        const query = `
            SELECT Interests.InterestName 
            FROM UserInterests
            INNER JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE UserInterests.UserID = ?`;
        try {
            const [results] = await db.query(query, [this.id]); // ✅ Destructure for consistency
            this.interests = results.map(row => row.InterestName);
            return this.interests;
        } catch (err) {
            console.error("Error fetching user interests:", err);
            throw err;
        }
    }

    // Finds a user by their email address
    // This method retrieves a user from the database using their email
    static async findByEmail(email) {
        const query = "SELECT * FROM Users WHERE Email = ?";
        try {
            const [results] = await db.query(query, [email]);
            return results[0] || null;
        } catch (err) {
            console.error("Error finding user by email:", err);
            throw err;
        }
    }

    // Delete a user
    // This method removes a user from the database
    static async deleteUser(userId) {
        const query = "DELETE FROM Users WHERE UserID = ?";
        try {
            const [results] = await db.query(query, [userId]);
            return { message: `User ${userId} deleted successfully.` };
        } catch (err) {
            console.error("Error deleting user:", err);
            throw err;
        }
    }

    // Searches for users based on a query string
    // This method retrieves users whose names, interests, or available times match the query
    static async searchUsers(query) {
        const sql = `
            SELECT DISTINCT Users.UserID, Users.FullName, Users.Email, Users.AvailableTime
            FROM Users
            LEFT JOIN UserInterests ON Users.UserID = UserInterests.UserID
            LEFT JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE Users.FullName LIKE ? OR Interests.InterestName LIKE ? OR Users.AvailableTime LIKE ?
            LIMIT 20`;
        const searchQuery = `%${query}%`;
        try {
            const [results] = await db.query(sql, [searchQuery, searchQuery, searchQuery]);
            return results.length > 0 ? results : [];
        } catch (err) {
            console.error("Error searching users:", err);
            throw err;
        }
    }

    // Searches for users by name
    // This method retrieves users whose names match the provided name
    static async searchByName(name) {
        const sql = `
            SELECT UserID, FullName, Email, AcademicInfo, Interests, AvailableTime 
            FROM Users 
            WHERE FullName LIKE ?`;
        try {
            const [results] = await db.query(sql, [`%${name}%`]);
            return results;
        } catch (err) {
            console.error("Error searching by name:", err);
            throw err;
        }
    }

    // Searches for users by academic information
    // This method retrieves users whose academic information matches the provided info
    static async searchByAcademicInfo(academicInfo) {
        const sql = `
            SELECT UserID, FullName, Email, AcademicInfo, Interests, AvailableTime 
            FROM Users 
            WHERE AcademicInfo LIKE ?`;
        try {
            const [results] = await db.query(sql, [`%${academicInfo}%`]);
            return results;
        } catch (err) {
            console.error("Error searching by academic info:", err);
            throw err;
        }
    }

    // Searches for users by interest
    // This method retrieves users whose interests match the provided interest
    // It uses a JOIN to connect Users with Interests through UserInterests
    static async searchByInterest(interest) {
        const sql = `
            SELECT DISTINCT Users.UserID, Users.FullName, Users.Email, Users.AcademicInfo, Users.Interests, Users.AvailableTime
            FROM Users
            JOIN UserInterests ON Users.UserID = UserInterests.UserID
            JOIN Interests ON UserInterests.InterestID = Interests.InterestID
            WHERE Interests.InterestName LIKE ?`;
        try {
            const [results] = await db.query(sql, [`%${interest}%`]);
            return results;
        } catch (err) {
            console.error("Error searching by interest:", err);
            throw err;
        }
    }

    // Searches for users by course
    // This method retrieves users whose courses match the provided course name
    static async searchByCourse(course) {
        const sql = `
            SELECT DISTINCT Users.UserID, Users.FullName, Users.Email, Users.AcademicInfo, Users.Interests, Users.AvailableTime
            FROM Users
            JOIN UserCourses ON Users.UserID = UserCourses.UserID
            JOIN Courses ON UserCourses.CourseID = Courses.CourseID
            WHERE Courses.CourseName LIKE ?`;
        try {
            const [results] = await db.query(sql, [`%${course}%`]);
            return results;
        } catch (err) {
            console.error("Error searching by course:", err);
            throw err;
        }
    }

    // Fetches all users from the database
    // This method retrieves all users and their details
    static async getAllUsers() {
        const sql = `
            SELECT UserID, FullName, Email, AcademicInfo, Interests, AvailableTime 
            FROM Users`;
        try {
            const [results] = await db.query(sql);
            return results;
        } catch (err) {
            console.error("Error fetching all users:", err);
            throw err;
        }
    }
    
    //Fetches a user by their ID
    // This method retrieves a user from the database using their user ID
    static async getUserById(userId) {
        const sql = "SELECT UserID, FullName, Email FROM Users WHERE UserID = ?";
        try {
            const [results] = await db.query(sql, [userId]);
            return results[0] || null;
        } catch (err) {
            console.error("Error fetching user by ID:", err);
            throw err;
        }
    }
}

module.exports = { User };
