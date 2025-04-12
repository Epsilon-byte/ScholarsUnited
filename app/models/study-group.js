const db = require("../services/db"); // Import the database connection

class StudyGroup {
  constructor(id) {
    this.id = id;
    this.name = null;
    this.description = null;
    this.courseId = null;
    this.creatorId = null;
    this.maxParticipants = null;
    this.isPrivate = null;
    this.createdAt = null;
    this.members = [];
  }

  // Get study group details
  async getGroupDetails() {
    const query = `
      SELECT sg.*, c.CourseName, u.FullName as CreatorName,
        (SELECT COUNT(*) FROM StudyGroupMembers WHERE GroupID = sg.GroupID) as MemberCount
      FROM StudyGroups sg
      LEFT JOIN Courses c ON sg.CourseID = c.CourseID
      LEFT JOIN Users u ON sg.CreatorID = u.UserID
      WHERE sg.GroupID = ?
    `;
    
    try {
      const [results] = await db.query(query, [this.id]);
      if (results && results.length > 0) {
        const group = results[0];
        this.name = group.Name;
        this.description = group.Description;
        this.courseId = group.CourseID;
        this.creatorId = group.CreatorID;
        this.maxParticipants = group.MaxParticipants;
        this.isPrivate = group.IsPrivate;
        this.createdAt = group.CreatedAt;
        return group;
      }
      return null;
    } catch (err) {
      console.error("Error fetching study group details:", err);
      throw err;
    }
  }

  // Get all members of a study group
  async getGroupMembers() {
    const query = `
      SELECT sgm.*, u.FullName, u.Email, u.ProfilePicture
      FROM StudyGroupMembers sgm
      JOIN Users u ON sgm.UserID = u.UserID
      WHERE sgm.GroupID = ?
      ORDER BY sgm.Role ASC, sgm.JoinedAt ASC
    `;
    
    try {
      const [results] = await db.query(query, [this.id]);
      this.members = results || [];
      return this.members;
    } catch (err) {
      console.error("Error fetching study group members:", err);
      throw err;
    }
  }

  // Add a member to the study group
  async addMember(userId, role = 'member') {
    // Check if user is already a member
    const checkQuery = `
      SELECT * FROM StudyGroupMembers
      WHERE GroupID = ? AND UserID = ?
    `;
    
    try {
      const [existingMember] = await db.query(checkQuery, [this.id, userId]);
      if (existingMember && existingMember.length > 0) {
        return { success: false, message: "User is already a member of this group" };
      }
      
      // Check if group has reached maximum participants
      const [groupDetails] = await db.query(
        'SELECT MaxParticipants, (SELECT COUNT(*) FROM StudyGroupMembers WHERE GroupID = ?) as CurrentCount FROM StudyGroups WHERE GroupID = ?',
        [this.id, this.id]
      );
      
      if (groupDetails[0].CurrentCount >= groupDetails[0].MaxParticipants) {
        return { success: false, message: "Group has reached maximum number of participants" };
      }
      
      // Add member
      const insertQuery = `
        INSERT INTO StudyGroupMembers (GroupID, UserID, Role)
        VALUES (?, ?, ?)
      `;
      
      await db.query(insertQuery, [this.id, userId, role]);
      return { success: true, message: "Successfully joined the study group" };
    } catch (err) {
      console.error("Error adding member to study group:", err);
      throw err;
    }
  }

  // Remove a member from the study group
  async removeMember(userId) {
    const query = `
      DELETE FROM StudyGroupMembers
      WHERE GroupID = ? AND UserID = ?
    `;
    
    try {
      const [result] = await db.query(query, [this.id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error removing member from study group:", err);
      throw err;
    }
  }

  // Update member role
  async updateMemberRole(userId, newRole) {
    const query = `
      UPDATE StudyGroupMembers
      SET Role = ?
      WHERE GroupID = ? AND UserID = ?
    `;
    
    try {
      const [result] = await db.query(query, [newRole, this.id, userId]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error updating member role:", err);
      throw err;
    }
  }

  // Create a new study group
  static async createGroup(name, description, courseId, creatorId, maxParticipants = 10, isPrivate = false) {
    const query = `
      INSERT INTO StudyGroups (Name, Description, CourseID, CreatorID, MaxParticipants, IsPrivate)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.query(query, [name, description, courseId, creatorId, maxParticipants, isPrivate]);
      const groupId = result.insertId;
      
      // Add creator as a member with 'creator' role
      const memberQuery = `
        INSERT INTO StudyGroupMembers (GroupID, UserID, Role)
        VALUES (?, ?, 'creator')
      `;
      
      await db.query(memberQuery, [groupId, creatorId]);
      
      return groupId;
    } catch (err) {
      console.error("Error creating study group:", err);
      throw err;
    }
  }

  // Update study group details
  async updateGroup(name, description, courseId, maxParticipants, isPrivate) {
    const query = `
      UPDATE StudyGroups
      SET Name = ?, Description = ?, CourseID = ?, MaxParticipants = ?, IsPrivate = ?
      WHERE GroupID = ?
    `;
    
    try {
      const [result] = await db.query(query, [name, description, courseId, maxParticipants, isPrivate, this.id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error updating study group:", err);
      throw err;
    }
  }

  // Delete a study group
  async deleteGroup() {
    const query = `
      DELETE FROM StudyGroups
      WHERE GroupID = ?
    `;
    
    try {
      const [result] = await db.query(query, [this.id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error("Error deleting study group:", err);
      throw err;
    }
  }

  // Get all study groups (with optional filters)
  static async getAllGroups(filters = {}) {
    let query = `
      SELECT sg.*, c.CourseName, u.FullName as CreatorName,
        (SELECT COUNT(*) FROM StudyGroupMembers WHERE GroupID = sg.GroupID) as MemberCount
      FROM StudyGroups sg
      LEFT JOIN Courses c ON sg.CourseID = c.CourseID
      LEFT JOIN Users u ON sg.CreatorID = u.UserID
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Apply filters
    if (filters.courseId) {
      query += " AND sg.CourseID = ?";
      queryParams.push(filters.courseId);
    }
    
    if (filters.creatorId) {
      query += " AND sg.CreatorID = ?";
      queryParams.push(filters.creatorId);
    }
    
    if (filters.isPrivate !== undefined) {
      query += " AND sg.IsPrivate = ?";
      queryParams.push(filters.isPrivate);
    }
    
    if (filters.search) {
      query += " AND (sg.Name LIKE ? OR sg.Description LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    // Add pagination if provided
    if (filters.limit) {
      query += " LIMIT ?";
      queryParams.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += " OFFSET ?";
        queryParams.push(parseInt(filters.offset));
      }
    }
    
    try {
      const [results] = await db.query(query, queryParams);
      return results || [];
    } catch (err) {
      console.error("Error fetching study groups:", err);
      throw err;
    }
  }

  // Get study groups for a specific user
  static async getUserGroups(userId) {
    const query = `
      SELECT sg.*, c.CourseName, u.FullName as CreatorName, sgm.Role as UserRole,
        (SELECT COUNT(*) FROM StudyGroupMembers WHERE GroupID = sg.GroupID) as MemberCount
      FROM StudyGroups sg
      JOIN StudyGroupMembers sgm ON sg.GroupID = sgm.GroupID
      LEFT JOIN Courses c ON sg.CourseID = c.CourseID
      LEFT JOIN Users u ON sg.CreatorID = u.UserID
      WHERE sgm.UserID = ?
      ORDER BY sgm.JoinedAt DESC
    `;
    
    try {
      const [results] = await db.query(query, [userId]);
      return results || [];
    } catch (err) {
      console.error("Error fetching user study groups:", err);
      throw err;
    }
  }

  // Check if a user is a member of a study group
  static async isUserMember(groupId, userId) {
    const query = `
      SELECT * FROM StudyGroupMembers
      WHERE GroupID = ? AND UserID = ?
    `;
    
    try {
      const [results] = await db.query(query, [groupId, userId]);
      return results && results.length > 0 ? results[0] : null;
    } catch (err) {
      console.error("Error checking group membership:", err);
      throw err;
    }
  }

  // Get total count of study groups (for pagination)
  static async getGroupCount(filters = {}) {
    let query = `
      SELECT COUNT(*) as count
      FROM StudyGroups sg
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Apply filters
    if (filters.courseId) {
      query += " AND sg.CourseID = ?";
      queryParams.push(filters.courseId);
    }
    
    if (filters.creatorId) {
      query += " AND sg.CreatorID = ?";
      queryParams.push(filters.creatorId);
    }
    
    if (filters.isPrivate !== undefined) {
      query += " AND sg.IsPrivate = ?";
      queryParams.push(filters.isPrivate);
    }
    
    if (filters.search) {
      query += " AND (sg.Name LIKE ? OR sg.Description LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm);
    }
    
    try {
      const [results] = await db.query(query, queryParams);
      return results[0].count || 0;
    } catch (err) {
      console.error("Error counting study groups:", err);
      throw err;
    }
  }
}

module.exports = { StudyGroup };
