const db = require("../services/db"); // Import the database connection

// Event class to handle event operations
// This class is responsible for fetching event details, creating new events, updating events, and deleting events.
// It interacts with the database to perform these operations and handles errors appropriately.
class Event {
  constructor(id) {
    this.id = id;
    this.name = null;
    this.description = null;
    this.date = null;
    this.time = null;
    this.location = null;
    this.userId = null;
    this.participants = null;
  }

  // Fetches upcoming events from the database
  // Static method: retrieves all upcoming events from the database
  static async getUpcomingEvents() {
    const query = `
      SELECT * FROM Events 
      WHERE Date >= CURDATE()
      ORDER BY Date ASC`;
    try {
      const [rows] = await db.query(query);
      return rows || [];
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
      throw err;
    }
  }  

  // Retrieves all participants of the event (joins with Users table)
  // Instance method: fetches all participants for the current event
  async getEventParticipants() {
    const query = `
      SELECT Users.UserID, Users.FullName 
      FROM EventParticipants
      INNER JOIN Users ON EventParticipants.UserID = Users.UserID
      WHERE EventParticipants.EventID = ?`;
    try {
      const [results] = await db.query(query, [this.id]);
      this.participants = results;
      return this.participants;
    } catch (err) {
      console.error("Error fetching participants:", err);
      throw err;
    }
  }

  // Static method: creates a new event in the database
  // This method takes event details as parameters and inserts them into the Events table
  // It returns the ID of the newly created event.
  static async createEvent(title, description, date, time, location, userId) {
    const query = `INSERT INTO Events (Title, Description, Date, Time, Location, UserID) VALUES (?, ?, ?, ?, ?, ?)`;
    try {
      const [results] = await db.query(query, [title, description, date, time, location, userId]);
      return results.insertId;
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  }

  // Updates the current event with new details
  // This method takes event details as parameters and updates the corresponding event in the database
  // It returns true if the update was successful, false otherwise.
  async updateEvent(name, description, date, time, location) {
    const query = `UPDATE Events SET Title = ?, Description = ?, Date = ?, Time = ?, Location = ? WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [name, description, date, time, location, this.id]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error updating event:", err);
      throw err;
    }
  }

  // Deletes the current event from the database
  // This method removes the event from the Events table based on its ID
  // It returns true if the deletion was successful, false otherwise.
  async deleteEvent() {
    const query = `DELETE FROM Events WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [this.id]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error deleting event:", err);
      throw err;
    }
  }

  // Static method: fetches all events from the database
  // This method retrieves all events from the Events table
  // It returns an array of events, or an empty array if no events are found.
  static async getAllEvents() {
    const query = `SELECT * FROM Events`;
    try {
      const [results] = await db.query(query);
      return results || [];
    } catch (err) {
      console.error("Error fetching all events:", err);
      throw err;
    }
  }
  
  // Static method: get total count of events
  static async getEventCount() {
    const query = `SELECT COUNT(*) as count FROM Events`;
    try {
      const [results] = await db.query(query);
      return results[0].count || 0;
    } catch (err) {
      console.error("Error counting events:", err);
      throw err;
    }
  }
  
  // Static method: fetches events with pagination
  static async getEventsPaginated(offset, limit) {
    const query = `SELECT * FROM Events ORDER BY Date DESC LIMIT ? OFFSET ?`;
    try {
      const [results] = await db.query(query, [limit, offset]);
      return results || [];
    } catch (err) {
      console.error("Error fetching paginated events:", err);
      throw err;
    }
  }

  // Static method: fetches a specific event by ID
  // This method retrieves the event details from the Events table based on its ID
  // It returns the event object if found, or null if not found.
  static async getEventById(eventId) {
    const query = `SELECT * FROM Events WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [eventId]);
      return results[0] || null;
    } catch (err) {
      console.error("Error fetching event by ID:", err);
      throw err;
    }
  }
}

module.exports = { Event };
