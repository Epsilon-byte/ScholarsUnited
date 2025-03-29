const db = require("../services/db"); // Import database connection

class Event {
    constructor(id) {
        this.id = id;
        this.name = null;
        this.description = null;
        this.date = null;
        this.time = null;
        this.location = null;
        this.userId = null;
        this.participants = null; // Initializes participants to null or an empty array []
    }
    

    // Fetches event participants
    async getEventParticipants() {
        const query = `
            SELECT Users.UserID, Users.FullName 
            FROM EventParticipants
            INNER JOIN Users ON EventParticipants.UserID = Users.UserID
            WHERE EventParticipants.EventID = ?`;
        try {
            const [results] = await db.promise().query(query, [this.id]);
            this.participants = results;
            return this.participants;
        } catch (err) {
            console.error("Error fetching participants:", err);
            throw err; // Re-throw the error to be handled by the caller
        }
    }

    // Static method to create a new event
    static async createEvent(title, description, date, time, location, userId) {
        const query = "INSERT INTO Events (Title, Description, Date, Time, Location, UserID) VALUES (?, ?, ?, ?, ?, ?)";
        try {
          const [results] = await db.query(query, [title, description, date, time, location, userId]);
          return results.insertId; // Return the new event's ID
        } catch (err) {
          console.error("Error creating event:", err);
          throw err;
        }
      }

    // Updates an existing event
    async updateEvent(name, description, date, time, location) {
        const query = "UPDATE Events SET Title = ?, Description = ?, Date = ?, Time = ?, Location = ? WHERE EventID = ?";
        try {
            const [results] = await db.promise().query(query, [name, description, date, time, location, this.id]);
            return results.affectedRows > 0; // Returns true if updated, false otherwise
        } catch (err) {
            console.error("Error updating event:", err);
            throw err;
        }
    }

    // Deletes an event
    async deleteEvent() {
        const query = "DELETE FROM Events WHERE EventID = ?";
        try {
            const [results] = await db.promise().query(query, [this.id]);
            return results.affectedRows > 0; // Returns true if deleted, false otherwise
        } catch (err) {
            console.error("Error deleting event:", err);
            throw err;
        }
    }

    // Adds a participant to the event
    async addParticipant(userId) {
        const query = "INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)";
        try {
            const [results] = await db.promise().query(query, [userId, this.id]);
            return results.affectedRows > 0; // Returns true if added, false otherwise
        } catch (err) {
            console.error("Error adding participant:", err);
            throw err;
        }
    }

    // Removes a participant from the event
    async removeParticipant(userId) {
        const query = "DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?";
        try {
            const [results] = await db.promise().query(query, [userId, this.id]);
            return results.affectedRows > 0; // Returns true if removed, false otherwise
        } catch (err) {
            console.error("Error removing participant:", err);
            throw err;
        }
    }

    // Fetches all events
    static async getAllEvents() {
        const query = "SELECT * FROM Events";
        try {
          const [results] = await db.query(query); // Destructures the array to get only the rows
          console.log("Fetched Events:", results); // Debugging log to see if the fetch was successful
          return results || []; // Return an array, even if empty
        } catch (err) {
          console.error("Error fetching all events:", err);
          throw err;
        }
      }

    // Fetches upcoming events (events happening in the future)
    static async getUpcomingEvents() {
        const query = "SELECT * FROM Events WHERE Date >= CURDATE() ORDER BY Date ASC";
        try {
            const [rows] = await db.query(query);  // ✅ extract only rows
            console.log("Fetched Upcoming Events:", rows);
            return rows || [];
        } catch (err) {
            console.error("Error fetching upcoming events:", err);
            throw err;
        }
    }
    

    static async getEventById(eventId) {
        const query = "SELECT * FROM Events WHERE EventID = ?";
        try {
          const [results] = await db.query(query, [eventId]);
          return results[0] || null; // Returns the first row (event) or null if not found
        } catch (err) {
          console.error("Error fetching event by ID:", err);
          throw err;
        }
      }
}

module.exports = { Event };