const db = require("../services/db"); // Import the database connection

class StudySession {
  constructor(id) {
    this.id = id;
    this.groupId = null;
    this.title = null;
    this.description = null;
    this.date = null;
    this.startTime = null;
    this.endTime = null;
    this.location = null;
    this.isOnline = null;
    this.meetingLink = null;
    this.creatorId = null;
    this.createdAt = null;
    this.participants = [];
    this.resources = [];
  }

  // Get session details
  async getSessionDetails() {
    const query = `
      SELECT ss.*, sg.Name as GroupName, u.FullName as CreatorName,
        (SELECT COUNT(*) FROM SessionParticipants WHERE SessionID = ss.SessionID AND Status = 'attending') as AttendeeCount
      FROM StudySessions ss
      JOIN StudyGroups sg ON ss.GroupID = sg.GroupID
      JOIN Users u ON ss.CreatorID = u.UserID
      WHERE ss.SessionID = ?
    `;
    
    try {
      const [results] = await db.query(query, [this.id]);
      if (results && results.length > 0) {
        const session = results[0];
        this.groupId = session.GroupID;
        this.title = session.Title;
        this.description = session.Description;
        this.date = session.Date;
        this.startTime = session.StartTime;
        this.endTime = session.EndTime;
        this.location = session.Location;
        this.isOnline = session.IsOnline;
        this.meetingLink = session.MeetingLink;
        this.creatorId = session.CreatorID;
        this.createdAt = session.CreatedAt;
        return session;
      }
      return null;
    } catch (err) {
      console.error("Error fetching study session details:", err);
      throw err;
    }
  }

  // Get all participants of a session
  async getSessionParticipants() {
    const query = `
      SELECT sp.*, u.FullName, u.Email, u.ProfilePicture
      FROM SessionParticipants sp
      JOIN Users u ON sp.UserID = u.UserID
      WHERE sp.SessionID = ?
      ORDER BY sp.Status, sp.JoinedAt
    `;
    
    try {
      const [results] = await db.query(query, [this.id]);
      this.participants = results || [];
      return this.participants;
    } catch (err) {
      console.error("Error fetching session participants:", err);
      throw err;
    }
  }

  // Get all resources for a session
  async getSessionResources() {
    const query = `
      SELECT sr.*, u.FullName as UploaderName
      FROM SessionResources sr
      JOIN Users u ON sr.UploadedBy = u.UserID
      WHERE sr.SessionID = ?
      ORDER BY sr.UploadedAt DESC
    `;
    
    try {
      const [results] = await db.query(query, [this.id]);
      this.resources = results || [];
      return this.resources;
    } catch (err) {
      console.error("Error fetching session resources:", err);
      throw err;
    }
  }

  // Add a participant to the session
  async addParticipant(userId, status = 'attending') {
    // Check if user is already a participant
    const checkQuery = `
      SELECT * FROM SessionParticipants
      WHERE SessionID = ? AND UserID = ?
    `;
    
    try {
      const [existingParticipant] = await db.query(checkQuery, [this.id, userId]);
      
      if (existingParticipant && existingParticipant.length > 0) {
        // Update existing participant status
        const updateQuery = `
          UPDATE SessionParticipants
          SET Status = ?
          WHERE SessionID = ? AND UserID = ?
        `;
        
        await db.query(updateQuery, [status, this.id, userId]);
        return { success: true, message: "Participation status updated" };
      } else {
        // Add new participant
        const insertQuery = `
          INSERT INTO SessionParticipants (SessionID, UserID, Status)
          VALUES (?, ?, ?)
        `;
        
        await db.query(insertQuery, [this.id, userId, status]);
        return { success: true, message: "Successfully joined the study session" };
      }
    } catch (err) {
      console.error("Error adding participant to study session:", err);
      throw err;
    }
  }

  // Remove a participant from the session
  async removeParticipant(userId) {
    const query = `
      DELETE FROM SessionParticipants
      WHERE SessionID = ? AND UserID = ?
    `;
    
    try {
      const [result] = await db.query(query, [this.id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error removing participant from study session:", err);
      throw err;
    }
  }

  // Add a resource to the session
  async addResource(title, description, fileUrl, externalLink, uploadedBy) {
    const query = `
      INSERT INTO SessionResources (SessionID, Title, Description, FileURL, ExternalLink, UploadedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.query(query, [this.id, title, description, fileUrl, externalLink, uploadedBy]);
      return result.insertId;
    } catch (err) {
      console.error("Error adding resource to study session:", err);
      throw err;
    }
  }

  // Remove a resource from the session
  async removeResource(resourceId) {
    const query = `
      DELETE FROM SessionResources
      WHERE ResourceID = ? AND SessionID = ?
    `;
    
    try {
      const [result] = await db.query(query, [resourceId, this.id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error removing resource from study session:", err);
      throw err;
    }
  }

  // Create a new study session
  static async createSession(groupId, title, description, date, startTime, endTime, location, isOnline, meetingLink, creatorId) {
    const query = `
      INSERT INTO StudySessions (GroupID, Title, Description, Date, StartTime, EndTime, Location, IsOnline, MeetingLink, CreatorID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.query(query, [
        groupId, title, description, date, startTime, endTime, location, isOnline, meetingLink, creatorId
      ]);
      
      const sessionId = result.insertId;
      
      // Add creator as a participant with 'attending' status
      const participantQuery = `
        INSERT INTO SessionParticipants (SessionID, UserID, Status)
        VALUES (?, ?, 'attending')
      `;
      
      await db.query(participantQuery, [sessionId, creatorId]);
      
      return sessionId;
    } catch (err) {
      console.error("Error creating study session:", err);
      throw err;
    }
  }

  // Update study session details
  async updateSession(title, description, date, startTime, endTime, location, isOnline, meetingLink) {
    const query = `
      UPDATE StudySessions
      SET Title = ?, Description = ?, Date = ?, StartTime = ?, EndTime = ?, Location = ?, IsOnline = ?, MeetingLink = ?
      WHERE SessionID = ?
    `;
    
    try {
      const [result] = await db.query(query, [
        title, description, date, startTime, endTime, location, isOnline, meetingLink, this.id
      ]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error updating study session:", err);
      throw err;
    }
  }

  // Delete a study session
  async deleteSession() {
    const query = `
      DELETE FROM StudySessions
      WHERE SessionID = ?
    `;
    
    try {
      const [result] = await db.query(query, [this.id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error deleting study session:", err);
      throw err;
    }
  }

  // Get all sessions for a specific group
  static async getGroupSessions(groupId, includeCompleted = false) {
    let query = `
      SELECT ss.*, 
        (SELECT COUNT(*) FROM SessionParticipants WHERE SessionID = ss.SessionID AND Status = 'attending') as AttendeeCount
      FROM StudySessions ss
      WHERE ss.GroupID = ?
    `;
    
    if (!includeCompleted) {
      query += " AND ss.Date >= CURDATE()";
    }
    
    query += " ORDER BY ss.Date ASC, ss.StartTime ASC";
    
    try {
      const [results] = await db.query(query, [groupId]);
      return results || [];
    } catch (err) {
      console.error("Error fetching group study sessions:", err);
      throw err;
    }
  }

  // Get upcoming sessions for a specific user
  static async getUserUpcomingSessions(userId) {
    const query = `
      SELECT ss.*, sg.Name as GroupName,
        (SELECT COUNT(*) FROM SessionParticipants WHERE SessionID = ss.SessionID AND Status = 'attending') as AttendeeCount,
        sp.Status as UserStatus
      FROM StudySessions ss
      JOIN SessionParticipants sp ON ss.SessionID = sp.SessionID
      JOIN StudyGroups sg ON ss.GroupID = sg.GroupID
      WHERE sp.UserID = ? AND ss.Date >= CURDATE()
      ORDER BY ss.Date ASC, ss.StartTime ASC
    `;
    
    try {
      const [results] = await db.query(query, [userId]);
      return results || [];
    } catch (err) {
      console.error("Error fetching user upcoming sessions:", err);
      throw err;
    }
  }

  // Check if a user is a participant in a session
  static async isUserParticipant(sessionId, userId) {
    const query = `
      SELECT * FROM SessionParticipants
      WHERE SessionID = ? AND UserID = ?
    `;
    
    try {
      const [results] = await db.query(query, [sessionId, userId]);
      return results && results.length > 0 ? results[0] : null;
    } catch (err) {
      console.error("Error checking session participation:", err);
      throw err;
    }
  }

  // Get sessions happening today
  static async getTodaySessions() {
    const query = `
      SELECT ss.*, sg.Name as GroupName,
        (SELECT COUNT(*) FROM SessionParticipants WHERE SessionID = ss.SessionID AND Status = 'attending') as AttendeeCount
      FROM StudySessions ss
      JOIN StudyGroups sg ON ss.GroupID = sg.GroupID
      WHERE ss.Date = CURDATE()
      ORDER BY ss.StartTime ASC
    `;
    
    try {
      const [results] = await db.query(query);
      return results || [];
    } catch (err) {
      console.error("Error fetching today's study sessions:", err);
      throw err;
    }
  }
}

module.exports = { StudySession };
