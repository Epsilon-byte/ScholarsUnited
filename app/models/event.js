const db = require("../services/db"); // Import the database connection

class Event {
  constructor(id) {
    this.id = id;
    this.name = null;
    this.description = null;
    this.date = null;
    this.time = null;
    this.location = null;
    this.createdBy = null;
    this.status = 'active';
    this.participants = null;
  }

  // Retrieves all participants of the event (joins with Users table)
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
  static async createEvent(title, description, date, time, location, createdBy) {
    const query = `
      INSERT INTO Events (Title, Description, Date, Time, Location, Created_By, Status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')`;
    try {
      const [results] = await db.query(query, [title, description, date, time, location, createdBy]);
      return results.insertId;
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  }

  // Static method: updates event details
  static async updateEvent(id, title, description, date, time, location) {
    const query = `
      UPDATE Events 
      SET Title = ?, Description = ?, Date = ?, Time = ?, Location = ? 
      WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [title, description, date, time, location, id]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error updating event:", err);
      throw err;
    }
  }

  // Static method: cancels an event by updating its status
  static async cancelEvent(eventId) {
    const query = `UPDATE Events SET Status = 'cancelled' WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [eventId]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error cancelling event:", err);
      throw err;
    }
  }

  // Deletes the current event from the database
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

  // Adds a user as a participant to this event
  async addParticipant(userId) {
    const query = `INSERT INTO EventParticipants (UserID, EventID) VALUES (?, ?)`;
    try {
      const [results] = await db.query(query, [userId, this.id]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error adding participant:", err);
      throw err;
    }
  }

  // Removes a user from this event's participants
  async removeParticipant(userId) {
    const query = `DELETE FROM EventParticipants WHERE UserID = ? AND EventID = ?`;
    try {
      const [results] = await db.query(query, [userId, this.id]);
      return results.affectedRows > 0;
    } catch (err) {
      console.error("Error removing participant:", err);
      throw err;
    }
  }

  // Static method: fetches all events (excluding cancelled)
  static async getAllEvents() {
    const query = `SELECT * FROM Events WHERE Status != 'cancelled'`;
    try {
      const [results] = await db.query(query);
      return results || [];
    } catch (err) {
      console.error("Error fetching all events:", err);
      throw err;
    }
  }

  // Static method: fetches all upcoming events
  static async getUpcomingEvents() {
    const query = `
      SELECT * FROM Events 
      WHERE Date >= CURDATE() AND Status != 'cancelled' 
      ORDER BY Date ASC`;
    try {
      const [rows] = await db.query(query);
      return rows || [];
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
      throw err;
    }
  }

  // Static method: fetches a specific event by ID
  static async getEventById(eventId) {
    const query = `SELECT * FROM Events WHERE EventID = ?`;
    try {
      const [results] = await db.query(query, [eventId]);
      const event = results[0] || null;

      // Optional: map SQL fields to match JS naming
      if (event) {
        event.Created_By = event.Created_By ?? event.UserID; // backward compatibility
        event.created_by = event.Created_By;
        event.status = event.Status;
      }

      return event;
    } catch (err) {
      console.error("Error fetching event by ID:", err);
      throw err;
    }
  }
}

module.exports = { Event };
