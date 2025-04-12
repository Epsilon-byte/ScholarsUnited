// Imports required modules
const express = require("express"); // Express framework for building the server
const session = require("express-session"); // Session middleware for managing user sessions
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const dotenv = require("dotenv"); // Loads environment variables from a .env file
const ensureAuthenticated = require("./services/authMiddleware"); // Custom middleware to ensure user authentication
const helmet = require('helmet'); // Security headers
const http = require('http'); // HTTP server for Socket.io
const socketIo = require('socket.io'); // Socket.io for real-time messaging
const socketService = require('./services/socketService'); // Socket.io service for real-time communication

// Imports helper functions for formatting date and time
const { formatDate, formatTime } = require("./helper.js");

// Imports password policy service
const passwordPolicy = require('./services/passwordPolicy');

// Loads the environment variables from .env file
dotenv.config();

// Creates an Express application
const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketService.initializeSocketIO(server);

// Make io instance available to routes
app.set('io', io);

// ========== MIDDLEWARE SETUP ==========
// Serves static files (e.g., CSS) from the "app/public" directory
app.use(express.static("app/public"));

// Add Helmet middleware for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
    },
  },
  // Disable X-Powered-By header to hide Express
  hidePoweredBy: true
}));

// Parses URL-encoded and JSON request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configures session middleware
const isProduction = process.env.NODE_ENV === "production";

app.use(
    session({
      secret: process.env.SESSION_SECRET || "supersecretkey",
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 3600000, // Session cookie expires after 1 hour
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        httpOnly: true, // Prevents access from JavaScript
        sameSite: "lax" // Helps protect against CSRF
      }
    })
);

// CSRF protection removed to fix errors

// Rate limiting setup for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Sets the view engine to Pug and specify the views directory
app.set('view engine', 'pug');
app.set('views', './app/views');

// Imports database functions from db.js
const db = require('./services/db');

// Import password reset service
const passwordReset = require('./services/passwordReset');

// Import CAPTCHA service
const captchaService = require('./services/captchaService');

// Import study group models
const { StudyGroup } = require("./models/study-group");
const { StudySession } = require("./models/study-session");

// Imports models for database interactions
const { User } = require("./models/user");
const { Interest } = require("./models/interest");
const { UserInterest } = require("./models/user-interest");
const { Course } = require("./models/course");
const { UserCourse } = require("./models/user-course");
const { Event } = require("./models/event");
const { EventParticipant } = require("./models/event-participant");
const { EventMessage } = require("./models/event-message");
const { Message } = require("./models/message");
const { BuddyRequest } = require("./models/buddy-request");
const { Notification } = require("./models/notification");

// ========== ROUTES ==========

// Root route - Redirect to login if not authenticated
app.get("/", (req, res) => {
    if (req.session.user) {
        // If the user is logged in, redirect to the dashboard
        return res.redirect("/dashboard");
    }
    // Otherwise, redirect to the login page
    res.redirect("/login");
});

// Renders the index page
app.get("/", function (req, res) {
    res.render("index");
});

// ========== USER ROUTES ==========
// Fetches user details by ID
app.get("/users/:id", ensureAuthenticated, function (req, res) {
    const user = new User(req.params.id);
    user.getUserDetails()
        .then(userDetails => {
            if (!userDetails) {
                res.status(404).send("User not found");
            } else {
                res.json(userDetails);
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching user details");
        });
});

// Deletes a user by ID
app.delete("/users/:id", ensureAuthenticated, function (req, res) {
    User.deleteUser(req.params.id)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting user");
        });
});

// Searches for users by query
app.get("/users/search/:query", ensureAuthenticated, function (req, res) {
    User.searchUsers(req.params.query)
        .then(results => {
            res.json(results);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error searching for users");
        });
});

// ========== INTEREST ROUTES ==========
// Fetches all interests
app.get("/interests", ensureAuthenticated, function (req, res) {
    Interest.getAllInterests()
        .then(interests => {
            res.json(interests);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching interests");
        });
});

// ========== USER-INTEREST ROUTES ==========
// Fetches interests for a specific user
app.get("/user-interests/:userId", ensureAuthenticated, function (req, res) {
    UserInterest.getInterestsByUserId(req.params.userId)
        .then(interests => {
            res.json(interests);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching user interests");
        });
});

// ========== COURSE ROUTES ==========
// Fetches all courses and render the courses page
app.get("/courses", ensureAuthenticated, async function (req, res) {
    try {
        const courses = await Course.getAllCourses();
        res.render("courses", { courses: courses || [] });
    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).send("Error fetching courses");
    }
});

// Add this route to your app.js or routes file
app.get('/courses/:courseId', async (req, res) => {
  try {
      const courseId = req.params.courseId;
      
      // 1. Get course details
      const [course] = await db.query(
          'SELECT * FROM Courses WHERE CourseID = ?', 
          [courseId]
      );
      
      if (!course || course.length === 0) {
          return res.status(404).send('Course not found');
      }

      // 2. Get users enrolled in this course
      const [enrolledUsers] = await db.query(`
          SELECT Users.UserID, Users.FullName, Users.Email 
          FROM UserCourses
          JOIN Users ON UserCourses.UserID = Users.UserID
          WHERE UserCourses.CourseID = ?
      `, [courseId]);

      // 3. Get related events for this course
      const [events] = await db.query(`
          SELECT * FROM Events
          WHERE Title LIKE ? OR Description LIKE ?
          ORDER BY Date DESC
      `, [`%${course[0].CourseName}%`, `%${course[0].CourseName}%`]);

      res.render('courseDetail', {
          title: course[0].CourseName,
          course: course[0],
          enrolledUsers,
          events
      });
      
  } catch (error) {
      console.error('Error fetching course details:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Enrollment routes
app.post('/courses/enroll', ensureAuthenticated, async (req, res) => {
  try {
      const { courseId } = req.body;
      const userId = req.session.user.id;
      
      await db.query(
          'INSERT INTO UserCourses (UserID, CourseID) VALUES (?, ?)',
          [userId, courseId]
      );
      
      res.sendStatus(200);
  } catch (error) {
      console.error('Error enrolling in course:', error);
      res.status(500).send('Internal Server Error');
  }
});

app.post('/courses/leave', ensureAuthenticated, async (req, res) => {
  try {
      const { courseId } = req.body;
      const userId = req.session.user.id;
      
      await db.query(
          'DELETE FROM UserCourses WHERE UserID = ? AND CourseID = ?',
          [userId, courseId]
      );
      
      res.sendStatus(200);
  } catch (error) {
      console.error('Error leaving course:', error);
      res.status(500).send('Internal Server Error');
  }
});

// ========== USER-COURSE ROUTES ==========
// Fetches courses for a specific user
app.get("/user-courses/:userId", ensureAuthenticated, function (req, res) {
    UserCourse.getCoursesByUserId(req.params.userId)
        .then(courses => {
            res.json(courses);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching user courses");
        });
});

// ========== EVENTS ROUTES ==========
// Main events page with pagination
app.get("/events", ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Get total count of events
    const totalEvents = await Event.getEventCount();
    const totalPages = Math.ceil(totalEvents / limit);

    // Get events with pagination
    const eventsData = await Event.getEventsPaginated(offset, limit);
    
    // Format date and time for display
    const events = eventsData.map(event => ({
      ...event,
      date: new Date(event.Date).toLocaleDateString(),
      time: event.Time
    }));

    // Pagination data
    const pagination = {
      page,
      limit,
      totalEvents,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages
    };

    res.render("events", {
      events,
      pagination,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.render("events", {
      events: [],
      pagination: null,
      error: "Failed to load events"
    });
  }
});

// Create event page
app.get("/events/create", ensureAuthenticated, (req, res) => {
  res.render("create-event", {
    user: req.session.user,
    messages: req.session.messages || {}
  });
  delete req.session.messages;
});

// Create event submission
app.post("/events/create", ensureAuthenticated, async (req, res) => {
  const { title, description, date, time, location } = req.body;
  const userId = req.session.user.id;

  try {
    // Validate required fields
    if (!title || !date) {
      req.session.messages = { error: ["Title and date are required."] };
      return res.redirect('/events/create');
    }

    // Create the event
    const eventId = await Event.createEvent(title, description, date, time, location, userId);
    
    if (eventId) {
      // Automatically add the creator as a participant
      await EventParticipant.addParticipant(userId, eventId);
      
      req.session.messages = { success: ["Event created successfully!"] };
      res.redirect(`/events/${eventId}`);
    } else {
      req.session.messages = { error: ["Failed to create event."] };
      res.redirect('/events/create');
    }
  } catch (err) {
    console.error("Error creating event:", err);
    req.session.messages = { error: ["Something went wrong."] };
    res.redirect('/events/create');
  }
});

// Edit event page
app.get("/events/edit/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;

  try {
    const eventData = await Event.getEventById(eventId);
    
    if (!eventData) {
      req.flash('error', 'Event not found');
      return res.redirect('/events');
    }

    // Format date for the form (YYYY-MM-DD)
    const event = {
      ...eventData,
      formattedDate: new Date(eventData.Date).toISOString().split('T')[0]
    };

    res.render("edit-event", {
      event,
      user: req.session.user,
      messages: req.session.messages || {}
    });
    delete req.session.messages;
  } catch (err) {
    console.error("Error fetching event for editing:", err);
    req.flash('error', 'Error loading event');
    res.redirect('/events');
  }
});

// Event details page
app.get("/events/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    // Get event details
    const eventData = await Event.getEventById(eventId);
    if (!eventData) {
    req.flash('error', 'Event not found');
    return res.redirect('/events');
    }

    // Format date and time
    const event = {
    ...eventData,
    date: new Date(eventData.Date).toLocaleDateString(),
    time: eventData.Time
    };

    // Get participants
    const participants = await EventParticipant.getEventParticipants(eventId);
    
    // Check if user is a participant
    const isParticipant = participants.some(p => p.UserID == userId);

    // Get event creator details
    const creator = await User.getUserById(eventData.CreatorID);

    res.render("event-details", {
    user: req.session.user,
    event: eventData,
    participants,
    isParticipant,
    creator,
    messages: req.session.messages || {}
    });
    
    // Clear flash messages
    delete req.session.messages;
} catch (err) {
    console.error("Error fetching event details:", err);
    req.flash('error', 'Error loading event details');
    res.redirect('/events');
}
});

// Event Chat Page
app.get("/events/:id/chat", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    // Get event details
    const eventData = await Event.getEventById(eventId);
    if (!eventData) {
      req.session.messages = { error: ["Event not found"] };
      return res.redirect('/events');
    }

    // Format date and time
    const event = {
      ...eventData,
      date: new Date(eventData.Date).toLocaleDateString(),
      time: eventData.Time
    };

    // Get participants
    const participants = await EventParticipant.getEventParticipants(eventId);
    
    // Check if user is a participant
    const isParticipant = participants.some(p => p.UserID == userId);

    // Get event messages
    const messages = await EventMessage.getEventMessages(eventId);

    res.render("event-chat", {
      user: req.session.user,
      event: event,
      participants,
      isParticipant,
      messages
    });
  } catch (err) {
    console.error("Error loading event chat:", err);
    req.session.messages = { error: ["Error loading event chat"] };
    res.redirect(`/events/${eventId}`);
  }
});

// API endpoint for sending event messages
app.post("/api/events/message", ensureAuthenticated, async (req, res) => {
  console.log('Event message API called with body:', req.body);
  const { eventId, userId, content } = req.body;
  const currentUserId = req.session.user.id;
  
  // Validate user identity
  if (parseInt(userId) !== parseInt(currentUserId)) {
    console.log('User ID mismatch:', userId, currentUserId);
    return res.status(403).json({ success: false, message: "User ID mismatch" });
  }
  
  try {
    // Check if user is allowed to send messages to this event
    console.log('Checking if user can send message to event');
    const canSend = await EventMessage.canUserSendMessage(userId, eventId);
    console.log('Can user send message:', canSend);
    
    if (!canSend) {
      return res.status(403).json({ success: false, message: "You must be a participant to send messages" });
    }
    
    // Create the message
    console.log('Creating message with:', userId, eventId, content);
    const result = await EventMessage.createMessage(userId, eventId, content);
    console.log('Message creation result:', result);
    
    if (result.success) {
      // Get the created message with sender info
      const message = await EventMessage.getMessageById(result.insertedId);
      console.log('Retrieved message:', message);
      
      // Get user info for the sender name
      const user = await User.getUserById(userId);
      console.log('User info:', user);
      
      // Prepare message data for socket
      const messageData = {
        messageId: message.MessageID,
        userId: message.SenderID,
        eventId: message.EventID,
        content: message.Content,
        timestamp: message.Timestamp,
        senderName: message.SenderName || (user ? user.FullName : 'Unknown User')
      };
      
      console.log('Emitting socket message with data:', messageData);
      
      // Emit the message to all users in the event room
      try {
        const io = req.app.get('io');
        if (io) {
          socketService.sendEventMessage(io, eventId, messageData);
          console.log('Socket message emitted successfully');
        } else {
          console.error('Socket.IO instance not available');
        }
      } catch (socketErr) {
        console.error('Error emitting socket message:', socketErr);
      }
      
      return res.json({ success: true, message: "Message sent successfully", messageData: message });
    } else {
      console.error('Failed to create message');
      return res.status(500).json({ success: false, message: "Failed to send message" });
    }
  } catch (err) {
    console.error("Error sending event message:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// API endpoint for updating event messages
app.post("/api/events/message/update/:id", ensureAuthenticated, async (req, res) => {
  const messageId = req.params.id;
  const { newContent } = req.body;
  const userId = req.session.user.id;
  
  try {
    // Get the message to check ownership
    const message = await EventMessage.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    
    // Check if the current user is the message sender
    if (parseInt(message.SenderID) !== parseInt(userId)) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages" });
    }
    
    // Update the message
    const result = await EventMessage.updateMessage(messageId, newContent);
    
    if (result.success) {
      // Get the updated message
      const updatedMessage = await EventMessage.getMessageById(messageId);
      
      // Emit the updated message to all users in the event room
      const io = req.app.get('io');
      socketService.sendEventMessage(io, message.EventID, {
        messageId: updatedMessage.MessageID,
        userId: updatedMessage.SenderID,
        eventId: updatedMessage.EventID,
        content: updatedMessage.Content,
        timestamp: updatedMessage.Timestamp,
        senderName: updatedMessage.SenderName,
        isUpdate: true
      });
      
      return res.json({ success: true, message: "Message updated successfully", messageData: updatedMessage });
    } else {
      return res.status(500).json({ success: false, message: "Failed to update message" });
    }
  } catch (err) {
    console.error("Error updating event message:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// API endpoint for deleting event messages
app.post("/api/events/message/delete/:id", ensureAuthenticated, async (req, res) => {
  const messageId = req.params.id;
  const userId = req.session.user.id;
  
  try {
    // Get the message to check ownership
    const message = await EventMessage.getMessageById(messageId);
    
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    
    // Check if the current user is the message sender
    if (parseInt(message.SenderID) !== parseInt(userId)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages" });
    }
    
    // Create a message instance to delete
    const messageObj = new EventMessage(message.SenderID, message.EventID, message.Content);
    messageObj.id = messageId;
    
    // Delete the message
    const result = await messageObj.deleteMessage();
    
    if (result.success) {
      // Emit deletion notification to all users in the event room
      const io = req.app.get('io');
      io.to(`event-${message.EventID}`).emit('eventMessageDeleted', messageId);
      
      return res.json({ success: true, message: "Message deleted successfully" });
    } else {
      return res.status(500).json({ success: false, message: "Failed to delete message" });
    }
  } catch (err) {
    console.error("Error deleting event message:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update event submission
app.post("/events/edit/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;
  const { title, description, date, time, location } = req.body;

  try {
    const event = new Event(eventId);
    const updated = await event.updateEvent(title, description, date, time, location);

    if (updated) {
      req.session.messages = { success: ["Event updated successfully!"] };
      res.redirect(`/events/${eventId}`);
    } else {
      req.session.messages = { error: ["Event update failed."] };
      res.redirect(`/events/edit/${eventId}`);
    }
  } catch (err) {
    console.error("Error updating event:", err);
    req.session.messages = { error: ["Something went wrong."] };
    res.redirect(`/events/edit/${eventId}`);
  }
});

// Handle event deletion
app.post("/events/delete/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = new Event(eventId);
    const success = await event.deleteEvent();

    if (success) {
      console.log(`Event with ID: ${eventId} has been deleted successfully.`);
      res.status(200).json({ message: "Event deleted successfully", eventId });
    } else {
      console.log(`No event found with ID: ${eventId}, unable to delete.`);
      res.status(404).json({ error: "Event not found" });
    }
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Server error during event deletion" });
  }
});

// Handles joining an event
app.post("/events/join/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    const result = await EventParticipant.addParticipant(userId, eventId);

    if (result.success) {
      req.session.messages = { success: ["Successfully joined the event!"] };
      res.redirect(`/events/${eventId}/chat`);
    } else {
      req.session.messages = { error: ["Failed to join event"] };
      res.redirect(`/events/${eventId}`);
    }
  } catch (err) {
    console.error("Error joining event:", err);
    req.session.messages = { error: ["Error joining event"] };
    res.redirect(`/events/${eventId}`);
  }
});

// Handles leaving an event
app.post("/events/leave/:id", ensureAuthenticated, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.session.user.id;

  try {
    const result = await EventParticipant.removeParticipant(userId, eventId);

    if (result.success) {
      req.session.messages = { success: ["Successfully left the event"] };
      res.redirect(`/events/${eventId}`);
    } else {
      req.session.messages = { error: ["You are not a participant in this event"] };
      res.redirect(`/events/${eventId}`);
    }
  } catch (err) {
    console.error("Error leaving event:", err);
    req.session.messages = { error: ["Error leaving event"] };
    res.redirect(`/events/${eventId}`);
  }
});

// API endpoint for sending event messages
app.post('/api/events/message', async (req, res) => {
  try {
    const { eventId, userId, content } = req.body;
    
    console.log('Received message request:', { eventId, userId, content });
    
    if (!eventId || !userId || !content) {
      console.log('Missing required fields:', { eventId, userId, content });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if user is a participant
    const canSend = await EventMessage.canUserSendMessage(userId, eventId);
    if (!canSend) {
      console.log('User is not a participant:', { userId, eventId });
      return res.status(403).json({ success: false, message: 'You must be a participant to send messages' });
    }
    
    // Create message
    console.log('Creating message:', { userId, eventId, content });
    const result = await EventMessage.createMessage(userId, eventId, content);
    console.log('Message creation result:', result);
    
    if (!result.success) {
      console.log('Failed to create message:', result.message);
      return res.status(500).json({ success: false, message: result.message || 'Failed to create message' });
    }
    
    // Get user info for the socket broadcast
    const user = await User.getUserById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Emit socket event
    const socketService = req.app.get('socketService');
    if (socketService) {
      const messageData = {
        messageId: result.messageId,
        userId: userId,
        eventId: eventId,
        content: content,
        timestamp: new Date(),
        senderName: user.FullName
      };
      console.log('Sending socket event:', messageData);
      socketService.sendEventMessage(messageData);
    }
    
    console.log('Message created successfully:', result.messageId);
    return res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error creating event message:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint for deleting event messages
app.post('/api/events/message/delete/:messageId', async (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.body.userId || (req.session && req.session.user ? req.session.user.id : null);

  try {
    console.log("Delete message request:", { messageId, userId });
    
    if (!userId) {
      console.log("No user ID provided for delete");
      return res.status(401).json({
        success: false,
        message: "You must be logged in to delete messages"
      });
    }
    
    // Check if user owns the message
    const message = await EventMessage.getMessageById(messageId);
    if (!message) {
      console.log("Message not found for deletion:", messageId);
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    console.log("Message found for deletion:", message);
    
    if (message.SenderID != userId) {
      console.log("User does not own message:", { messageOwnerId: message.SenderID, requestUserId: userId });
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages"
      });
    }

    // Delete the message
    console.log("Deleting message:", messageId);
    const result = await EventMessage.deleteMessage(messageId);
    console.log("Delete result:", result);
    
    // Notify all users in the event room
    const socketService = req.app.get('socketService');
    if (socketService) {
      console.log("Emitting delete event for message:", messageId);
      socketService.emitEventMessageDeleted(message.EventID, messageId);
    }

    console.log("Message deleted successfully:", messageId);
    return res.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting event message:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message"
    });
  }
});

// API endpoint for updating event messages
app.post("/api/events/message/update/:messageId", async (req, res) => {
  const messageId = req.params.messageId;
  const { newContent } = req.body;
  const userId = req.body.userId || (req.session && req.session.user ? req.session.user.id : null);

  try {
    console.log("Update message request:", { messageId, userId, newContent });
    
    if (!userId) {
      console.log("No user ID provided for update");
      return res.status(401).json({
        success: false,
        message: "You must be logged in to update messages"
      });
    }
    
    if (!newContent || !newContent.trim()) {
      console.log("No content provided for update");
      return res.status(400).json({
        success: false,
        message: "New content is required"
      });
    }

    // Check if user owns the message
    const message = await EventMessage.getMessageById(messageId);
    if (!message) {
      console.log("Message not found for update:", messageId);
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    console.log("Message found for update:", message);
    
    if (message.SenderID != userId) {
      console.log("User does not own message:", { messageOwnerId: message.SenderID, requestUserId: userId });
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Update the message
    console.log("Updating message:", { messageId, newContent });
    const result = await EventMessage.updateMessage(messageId, newContent);
    console.log("Update result:", result);
    
    // Notify all users in the event room
    const socketService = req.app.get('socketService');
    if (socketService) {
      console.log("Emitting update event for message:", messageId);
      socketService.emitEventMessageUpdated(message.EventID, {
        messageId: messageId,
        content: newContent,
        timestamp: new Date()
      });
    }

    console.log("Message updated successfully:", messageId);
    return res.json({
      success: true,
      message: "Message updated successfully"
    });
  } catch (err) {
    console.error("Error updating event message:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update message"
    });
  }
});

// ========== MESSAGE ROUTES ==========
// Show messages for the current user
app.get("/messaging", ensureAuthenticated, async (req, res) => {
  console.log(" /messaging route hit!");
  
  const userId = req.session.user.id;
  const receiverId = req.query.receiverId;
  let receiver = null;

  try {
    // Get receiver details if receiverId is provided
    if (receiverId) {
      receiver = await User.getUserById(receiverId);
    }

    const rawMessages = await Message.getMessages(userId);
    
    const messages = rawMessages.map(msg => ({
      messageId: msg.MessageID,
      sender: msg.SenderName,
      receiver: msg.ReceiverName,
      senderId: msg.SenderID,
      receiverId: msg.ReceiverID,
      content: msg.Content,
      timestamp: new Date(msg.Timestamp).toLocaleString()
    }));

    res.render("messaging", {
      messages,
      user: req.session.user,
      receiver: receiver, // Pass the whole receiver object
      receiverId: receiverId || null
    });
  } catch (err) {
    console.error(" Error fetching messages:", err);
    res.render("messaging", { 
      messages: [], 
      user: req.session.user,
      receiver: null,
      receiverId: receiverId || null
    });
  }
});

// Show messages for any user (admin/debug)
app.get("/messages/:userId", ensureAuthenticated, async (req, res) => {
  const targetUserId = req.params.userId;

  try {
    const rawMessages = await Message.getMessages(targetUserId);

    const messages = rawMessages.map(msg => ({
      messageId: msg.MessageID, // Needed for delete/update
      sender: msg.SenderName,
      receiver: msg.ReceiverName,
      senderId: msg.SenderID,
      receiverId: msg.ReceiverID,
      content: msg.Content,
      timestamp: new Date(msg.Timestamp).toLocaleString()
    }));

    res.render("messaging", {
      messages,
      user: req.session.user
    });
  } catch (err) {
    console.error(" Error fetching messages:", err);
    res.render("messaging", { messages: [], user: req.session.user });
  }
});

// Handle sending a new message
app.post("/messages/send", ensureAuthenticated, async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.session.user.id;

  try {
    const message = new Message(senderId, receiverId, content);
    await message.sendMessage();

    res.redirect("/messaging");
  } catch (err) {
    console.error(" Error sending message:", err);
    res.status(500).send("Error sending message");
  }
});

// Delete message route
app.post("/messages/delete/:id", ensureAuthenticated, async (req, res) => {
  const messageId = req.params.id;

  try {
    const message = new Message();
    message.id = messageId;

    const result = await message.deleteMessage();

    if (result && result.message === "Message deleted successfully") {
      return res.redirect("/messaging");
    } else {
      return res.status(400).send("Failed to delete message");
    }
  } catch (err) {
    console.error(" Error deleting message:", err);
    res.status(500).send("Server error deleting message");
  }
});

// Update message route (edit form submission)
app.post("/messages/update/:id", ensureAuthenticated, async (req, res) => {
  const messageId = req.params.id;
  const { newContent } = req.body;

  try {
    const message = new Message();
    message.id = messageId;
    await message.updateMessage(newContent);

    res.redirect("/messaging");
  } catch (err) {
    console.error(" Error updating message:", err);
    res.status(500).send("Server error updating message");
  }
});

// ========== BUDDY REQUEST ROUTES ==========
// Fetches sent buddy requests for a specific user
app.get("/buddyRequests/sent/:userId", ensureAuthenticated, function (req, res) {
    BuddyRequest.getSentRequests(req.params.userId)
        .then(requests => {
            res.json(requests);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching sent buddy requests");
        });
});

// Fetches received buddy requests for a specific user
app.get("/buddyRequests/received/:userId", ensureAuthenticated, function (req, res) {
    BuddyRequest.getReceivedRequests(req.params.userId)
        .then(requests => {
            res.json(requests);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching received buddy requests");
        });
});

// ========== NOTIFICATION ROUTES ==========
// Marks a notification as read
app.post("/notifications/mark-as-read/:id", ensureAuthenticated, async (req, res) => {
    const notificationId = req.params.id;

    try {
        const notification = new Notification(notificationId);
        const success = await notification.markAsRead();

        if (success) {
            res.redirect("/dashboard");
        } else {
            res.status(400).send("Failed to mark notification as read");
        }
    } catch (err) {
        console.error("Error marking notification as read:", err);
        res.status(500).send("Error marking notification as read");
    }
});

// Deletes a notification
app.post("/notifications/delete/:id", ensureAuthenticated, async (req, res) => {
    const notificationId = req.params.id;

    try {
        const notification = new Notification(notificationId);
        const success = await notification.deleteNotification();

        if (success) {
            res.redirect("/dashboard");
        } else {
            res.status(400).send("Failed to delete notification");
        }
    } catch (err) {
        console.error("Error deleting notification:", err);
        res.status(500).send("Error deleting notification");
    }
});

// ========== CALENDAR ROUTE ==========
// Fetches all events and render the calendar page
const {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    format,
    parse,
  } = require("date-fns");
  
  app.get("/calendar", ensureAuthenticated, async function (req, res) {
    try {
      const rawEvents = await Event.getAllEvents();
  
      // Group events by ISO date (YYYY-MM-DD)
      const eventMap = {};
      rawEvents.forEach(event => {
        const isoDate = formatDate(event.Date); // e.g. '2025-03-31'
        const formattedEvent = {
          Title: event.Title,
          EventID: event.EventID,
        };
        if (!eventMap[isoDate]) eventMap[isoDate] = [];
        eventMap[isoDate].push(formattedEvent);
      });
  
      // Get selected month/year from query, fallback to current
      const month = parseInt(req.query.month) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year) || new Date().getFullYear();
  
      // Build calendar grid range
      const currentDate = parse(`${year}-${month}-01`, "yyyy-MM-dd", new Date());
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
      // Build day cells
      const calendarDays = [];
      let day = gridStart;
      while (day <= gridEnd) {
        const iso = formatDate(day); // Use same format used for event keys
        calendarDays.push({
          date: day,
          iso,
          isCurrentMonth: isSameMonth(day, monthStart),
          events: eventMap[iso] || [],
        });
        day = addDays(day, 1);
      }
  
      // For dropdown state
      const currentMonth = month;
      const currentYear = year;
  
      // Year dropdown range (2020–2035)
      const yearRange = [];
      for (let y = 2020; y <= 2035; y++) {
        yearRange.push(y);
      }
  
      // Prev/Next month logic
      const prevMonth = month - 1 < 1 ? 12 : month - 1;
      const nextMonth = month + 1 > 12 ? 1 : month + 1;
      const prevYear = month - 1 < 1 ? year - 1 : year;
      const nextYear = month + 1 > 12 ? year + 1 : year;
  
      // Display string
      const displayMonth = format(monthStart, "MMMM");
      const displayYear = format(monthStart, "yyyy");
  
      // Render calendar view
      res.render("calendar", {
        calendarDays,
        displayMonth,
        displayYear,
        prevMonth,
        nextMonth,
        prevYear,
        nextYear,
        currentMonth,
        currentYear,
        yearRange
      });
  
    } catch (err) {
      console.error("Error building calendar:", err);
      res.render("calendar", { calendarDays: [] });
    }
  });
  
  
// Handles joining an event
app.post("/events/join/:id", ensureAuthenticated, async function (req, res) {
    const eventId = req.params.id;
    const userId = req.session.user.id;

    try {
        const event = new Event(eventId);
        const success = await event.addParticipant(userId);

        if (success) {
            res.redirect(`/events/${eventId}`);
        } else {
            res.status(400).send("Failed to join event");
        }
    } catch (err) {
        console.error("Error joining event:", err);
        res.status(500).send("Error joining event");
    }
});

// ========== LOGIN ROUTE ==========
// Renders the login page
app.get("/login", (req, res) => {
    // Generate a simple CAPTCHA
    const captcha = captchaService.generateCaptcha();
    
    // Store the CAPTCHA text in the session
    req.session.captcha = captcha.text;
    
    res.render("login", { 
        messages: req.session.messages,
        captchaSvg: captcha.svg
    });
    req.session.messages = {}; // Clear messages after rendering
});

// Handles login form submission
app.post("/login", async (req, res) => {
    const { email, password, captcha } = req.body;
    
    // Verify CAPTCHA
    if (!captcha || captcha.trim() !== req.session.captcha) {
        req.session.messages = { 
            error: ["Incorrect CAPTCHA. Please try again."] 
        };
        return res.redirect('/login');
    }
    
    // Rate limiting check
    const ipAddress = req.ip;
    const currentTime = Date.now();
    
    if (loginAttempts.has(ipAddress)) {
        const attemptData = loginAttempts.get(ipAddress);
        
        // Check if account is locked
        if (attemptData.lockUntil && attemptData.lockUntil > currentTime) {
            const minutesLeft = Math.ceil((attemptData.lockUntil - currentTime) / 60000);
            req.session.messages = { 
                error: [`Too many failed login attempts. Please try again in ${minutesLeft} minutes.`] 
            };
            return res.redirect('/login');
        }
        
        // Reset lock if it has expired
        if (attemptData.lockUntil && attemptData.lockUntil <= currentTime) {
            attemptData.attempts = 0;
            attemptData.lockUntil = null;
        }
    } else {
        // First login attempt
        loginAttempts.set(ipAddress, {
            attempts: 0,
            lockUntil: null
        });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            // Increment failed attempts
            const attemptData = loginAttempts.get(ipAddress);
            attemptData.attempts += 1;
            
            // Lock account if too many attempts
            if (attemptData.attempts >= MAX_LOGIN_ATTEMPTS) {
                attemptData.lockUntil = currentTime + LOCK_TIME;
            }
            
            loginAttempts.set(ipAddress, attemptData);
            
            console.log("❌ User not found in database!");
            return res.status(401).send("Invalid email or password");
        }

        console.log("✅ User found:", user); // Debugging

        const match = await bcrypt.compare(password, user.Password);
        if (!match) {
            // Increment failed attempts
            const attemptData = loginAttempts.get(ipAddress);
            attemptData.attempts += 1;
            
            // Lock account if too many attempts
            if (attemptData.attempts >= MAX_LOGIN_ATTEMPTS) {
                attemptData.lockUntil = currentTime + LOCK_TIME;
            }
            
            loginAttempts.set(ipAddress, attemptData);
            
            console.log("❌ Password mismatch!");
            return res.status(401).send("Invalid email or password");
        }

        // Reset login attempts on successful login
        loginAttempts.delete(ipAddress);

        // Sets session data
        req.session.user = {
            id: user.UserID,
            email: user.Email,
            fullName: user.FullName,
        };

        console.log("Session set:", req.session.user); // Debugging - Checking to see if the setting the session was successful
        return res.redirect("/dashboard");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Internal server error");
    }
});

// ========== REGISTRATION ROUTE ==========
// Renders the registration page
app.get("/register", (req, res) => {
    // Generate a simple CAPTCHA
    const captcha = captchaService.generateCaptcha();
    
    // Store the CAPTCHA text in the session
    req.session.captcha = captcha.text;
    
    res.render("register", { 
        messages: req.session.messages,
        captchaSvg: captcha.svg
    });
    req.session.messages = {}; // Clear messages after rendering
});

// Handles registration form submission
app.post("/register", async (req, res) => {
    const { email, password, confirmPassword, fullName, interests, hobbies, academic_info, time_frames, captcha } = req.body;

    // Verify CAPTCHA
    if (!captcha || captcha.trim() !== req.session.captcha) {
        req.session.messages = { 
            error: ["Incorrect CAPTCHA. Please try again."] 
        };
        return res.redirect('/register');
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
        req.session.messages = { 
            error: ["Passwords do not match."] 
        };
        return res.redirect('/register');
    }
    
    // Validate password against policy
    const passwordValidation = passwordPolicy.validatePassword(password);
    if (!passwordValidation.isValid) {
        req.session.messages = { 
            error: [passwordValidation.message] 
        };
        return res.redirect('/register');
    }

    try {
        const newUser = await User.register({
            email,
            password,
            fullName,
            interests,
            hobbies,
            academicInfo: academic_info,
            availableTime: time_frames
        });

        console.log("✅ New user registered with ID:", newUser.id);
        req.session.messages = { success: ["Registration successful. Please log in."] };
        return res.redirect("/login");
    } catch (err) {
        console.error("❌ Registration Error:", err.message);
        req.session.messages = { 
            error: [err.message === 'Email already in use' 
                   ? "Email already in use." 
                   : "Registration failed. Please try again."]
        };
        return res.redirect("/register");
    }
});
// GET: Display Profile Page
app.get("/profile", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
  
    try {
      const user = new User(userId);
      const userDetails = await user.getUserDetails();
      const userInterests = await user.getUserInterests();
  
      if (!userDetails) {
        req.session.messages = { error: ["User not found."] };
        return res.redirect("/dashboard");
      }
  
      userDetails.Interests = Array.isArray(userInterests)
        ? userInterests.join(", ")
        : userDetails.Interests;
  
      // ✅ Extract then clear messages BEFORE rendering
      const messages = { ...req.session.messages }; // clone just in case
      req.session.messages = {}; // clear immediately
  
      // ✅ Explicitly remove the "login required" message if user is logged in
      if (messages.error) {
        messages.error = messages.error.filter(
          msg => msg !== "Please log in to access this page."
        );
      }
  
      res.render("profile", {
        user: req.session.user,
        userDetails,
        messages
      });
    } catch (err) {
      console.error("❌ Could not load profile", err);
      req.session.messages = { error: ["Could not load your profile."] };
      res.redirect("/dashboard");
    }
  }); 
   
  // POST: Handle Profile Updates
  app.post("/profile/update", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    let { interests, courses, free_time } = req.body;
  
    // ✅ If interests is an array (from multi-select), convert to comma-separated string
    if (Array.isArray(interests)) {
      interests = interests.join(", ");
    }
  
    try {
      const query = `
        UPDATE Users 
        SET Interests = ?, AcademicInfo = ?, AvailableTime = ?
        WHERE UserID = ?`;
  
      await db.query(query, [interests, courses, free_time, userId]);
  
      req.session.messages = { success: ["Profile updated successfully!"] };
      res.redirect("/profile");
    } catch (err) {
      console.error("❌ Error updating profile:", err);

      // ✅ Improved, specific error messages
      if (err.code === 'ER_PARSE_ERROR') {
        req.session.messages = {
          error: ["There was a problem with your input. Please check all fields and try again."]
        };
      } else if (err.code === 'ER_DUP_ENTRY') {
        req.session.messages = {
          error: ["An account with this email or data already exists."]
        };
      } else {
        req.session.messages = {
          error: ["Something went wrong while updating your profile. Please try again."]
        };

        // Optional: add technical details in development mode
        if (process.env.NODE_ENV !== 'production') {
          req.session.messages.error.push(`Details: ${err.message}`);
        }
      }

      res.redirect("/profile");
    }
  });

  app.post('/profile/delete', ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.id;

    try {
      // Delete user from database
      await db.query('DELETE FROM Users WHERE UserID = ?', [userId]);

      // Clear session and redirect
      req.session.destroy(err => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).send("Error ending session after deleting account.");
        }

        res.redirect('/login');
      });
    } catch (err) {
      console.error("Error deleting user account:", err);
      res.status(500).send("Error deleting account.");
    }
  });

  app.post('/profile/reset-password', ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    try {
      // ✅ Validate password match
      if (newPassword !== confirmPassword) {
        req.session.messages = {
          error: ["New passwords do not match. Please re-enter both fields."]
        };
        return res.redirect('/profile');
      }

      // Validate password against policy
      const passwordValidation = passwordPolicy.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        req.session.messages = { 
          error: [passwordValidation.message] 
        };
        return res.redirect('/profile');
      }

      // ✅ Retrieve current hashed password
      const [results] = await db.query('SELECT Password FROM Users WHERE UserID = ?', [userId]);

      if (!results || results.length === 0) {
        req.session.messages = {
          error: ["User not found. Please log in again."]
        };
        return res.redirect('/profile');
      }

      const hashedPassword = results[0].Password;
      const passwordMatch = await bcrypt.compare(currentPassword, hashedPassword);

      if (!passwordMatch) {
        req.session.messages = {
          error: ["Current password is incorrect. Please try again."]
        };
        return res.redirect('/profile');
      }

      // ✅ Update to new password
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE Users SET Password = ? WHERE UserID = ?', [newHashedPassword, userId]);

      req.session.messages = {
        success: ["Password updated successfully."]
      };
      res.redirect('/profile');
    } catch (err) {
      console.error("❌ Error resetting password:", err);

      // ✅ Friendly fallback message with optional debug info
      req.session.messages = {
        error: ["An unexpected error occurred while resetting your password."]
      };

      if (process.env.NODE_ENV !== 'production') {
        req.session.messages.error.push(`Details: ${err.message}`);
      }

      res.redirect('/profile');
    }
  });

// ========== PASSWORD RESET ROUTES ==========
// Forgot password form
app.get('/forgot-password', (req, res) => {
  // Generate a simple CAPTCHA
  const captcha = captchaService.generateCaptcha();
  
  // Store the CAPTCHA text in the session
  req.session.captcha = captcha.text;
  
  res.render('forgot-password', { 
    messages: req.session.messages,
    captchaSvg: captcha.svg
  });
  req.session.messages = {}; // Clear messages after rendering
});

// Handle forgot password submission
app.post('/forgot-password', async (req, res) => {
  const { email, captcha } = req.body;
  
  // Verify CAPTCHA
  if (!captcha || captcha.trim() !== req.session.captcha) {
    req.session.messages = { 
      error: ["Incorrect CAPTCHA. Please try again."] 
    };
    return res.redirect('/forgot-password');
  }
  
  try {
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (user) {
      // Generate reset token
      const token = await passwordReset.createResetToken(user.UserID);
      
      // Send reset email
      await passwordReset.sendResetEmail(user.Email, token, user.FullName);
    }
    
    // Always show success message even if email doesn't exist (security best practice)
    req.session.messages = { 
      success: ["If an account with that email exists, we've sent a password reset link."] 
    };
    return res.redirect('/login');
  } catch (err) {
    console.error("Password reset error:", err);
    req.session.messages = { 
      error: [err.message || "An error occurred. Please try again later."] 
    };
    return res.redirect('/forgot-password');
  }
});

// Reset password form
app.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Verify token
    const tokenData = await passwordReset.verifyToken(token);
    
    if (!tokenData) {
      req.session.messages = { 
        error: ["Invalid or expired password reset link. Please request a new one."] 
      };
      return res.redirect('/forgot-password');
    }
    
    // Generate a simple CAPTCHA
    const captcha = captchaService.generateCaptcha();
    
    // Store the CAPTCHA text in the session
    req.session.captcha = captcha.text;
    
    // Render reset password form
    res.render('reset-password', { 
      token,
      captchaSvg: captcha.svg,
      messages: req.session.messages
    });
    req.session.messages = {}; // Clear messages after rendering
  } catch (err) {
    console.error("Token verification error:", err);
    req.session.messages = { 
      error: [err.message || "An error occurred. Please try again later."] 
    };
    return res.redirect('/forgot-password');
  }
});

// Handle reset password submission
app.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword, captcha } = req.body;
  
  // Verify CAPTCHA
  if (!captcha || captcha.trim() !== req.session.captcha) {
    req.session.messages = { 
      error: ["Incorrect CAPTCHA. Please try again."] 
    };
    return res.redirect(`/reset-password/${token}`);
  }
  
  // Validate password match
  if (password !== confirmPassword) {
    req.session.messages = { 
      error: ["Passwords do not match. Please try again."] 
    };
    return res.redirect(`/reset-password/${token}`);
  }
  
  // Validate password against policy
  const passwordValidation = passwordPolicy.validatePassword(password);
  if (!passwordValidation.isValid) {
    req.session.messages = { 
      error: [passwordValidation.message] 
    };
    return res.redirect(`/reset-password/${token}`);
  }
  
  try {
    // Verify token
    const tokenData = await passwordReset.verifyToken(token);
    
    if (!tokenData) {
      req.session.messages = { 
        error: ["Invalid or expired password reset link. Please request a new one."] 
      };
      return res.redirect('/forgot-password');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password
    await db.query(
      'UPDATE Users SET Password = ? WHERE UserID = ?',
      [hashedPassword, tokenData.UserID]
    );
    
    // Mark token as used
    await passwordReset.markTokenAsUsed(tokenData.TokenID);
    
    req.session.messages = { 
      success: ["Your password has been reset successfully. Please log in with your new password."] 
    };
    return res.redirect('/login');
  } catch (err) {
    console.error("Password reset error:", err);
    req.session.messages = { 
      error: [err.message || "An error occurred. Please try again later."] 
    };
    return res.redirect(`/reset-password/${token}`);
  }
});

// ========== LOGOUT ROUTE ==========
// Handles user logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// ========== DASHBOARD ROUTE ==========
// Renders the dashboard page
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        console.log("No session or user ID found, redirecting to login");
        return res.redirect("/login");
    }

    console.log("Session data:", req.session.user);

    try {
        const notifications = await Notification.getNotificationsByUserId(req.session.user.id);
        let events = await Event.getUpcomingEvents();

        // ✅ Format Date & Time here
        events = events.map(event => ({
            ...event,
            date: formatDate(event.Date),
            time: formatTime(event.Time)
        }));

        res.render("dashboard", {
            user: req.session.user,
            notifications: notifications || [],
            events: events || [],
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).send("Server error");
    }
});

// ========== MATCHMAKING ROUTE ==========
// Renders the matchmaking page
// In your app.js or routes file

// Matchmaking page route
app.get('/matchmaking', async (req, res) => {
  try {
      const users = await User.getAllUsers();
      
      res.render('matchmaking', { 
          title: 'Find Study Buddies',
          users: users,
          searchPerformed: false
      });
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Search route
app.post('/matchmaking/search', async (req, res) => {
  try {
      const { searchTerm, searchType } = req.body;
      
      let users;
      
      switch(searchType) {
          case 'name':
              users = await User.searchByName(searchTerm);
              break;
              
          case 'academic':
              users = await User.searchByAcademicInfo(searchTerm);
              break;
              
          case 'interest':
              users = await User.searchByInterest(searchTerm);
              break;
              
          case 'course':
              users = await User.searchByCourse(searchTerm);
              break;
              
          default:
              users = await User.getAllUsers();
      }
      
      res.render('matchmaking', { 
          title: 'Search Results',
          users: users,
          searchPerformed: true,
          searchTerm: searchTerm,
          searchType: searchType
      });
      
  } catch (error) {
      console.error('Search error:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Export the app for socket.io integration
module.exports = app;

// ========== STUDY GROUP ROUTES ==========
// List all study groups with pagination
app.get("/study-groups", ensureAuthenticated, async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get filters
    const filters = {
      courseId: req.query.courseId,
      search: req.query.search,
      limit,
      offset
    };
    
    // Get total count of groups for pagination
    const totalGroups = await StudyGroup.getGroupCount(filters);
    const totalPages = Math.ceil(totalGroups / limit);
    
    // Get groups for current page
    const groups = await StudyGroup.getAllGroups(filters);
    
    // Get user's groups
    const userGroups = await StudyGroup.getUserGroups(req.session.user.id);
    
    // Get all courses for filter dropdown
    const courses = await Course.getAllCourses();

    res.render("study-groups", { 
      groups: groups || [], 
      userGroups: userGroups || [],
      courses: courses || [],
      user: req.session.user,
      filters: {
        courseId: req.query.courseId,
        search: req.query.search
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalGroups,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Error fetching study groups:", err);
    res.render("study-groups", { 
      groups: [],
      userGroups: [],
      courses: [],
      user: req.session.user,
      filters: {},
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        totalGroups: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }
});

// Create study group form
app.get("/study-groups/create", ensureAuthenticated, async (req, res) => {
  try {
    // Get all courses for dropdown
    const courses = await Course.getAllCourses();
    
    res.render("create-study-group", {
      courses: courses || [],
      user: req.session.user
    });
  } catch (err) {
    console.error("Error loading create study group form:", err);
    res.status(500).send("Error loading form");
  }
});

// Handle study group creation
app.post("/study-groups/create", ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, courseId, maxParticipants, isPrivate } = req.body;
    const creatorId = req.session.user.id;
    
    // Create the study group
    const groupId = await StudyGroup.createGroup(
      name, 
      description, 
      courseId, 
      creatorId, 
      maxParticipants || 10, 
      isPrivate === 'on'
    );
    
    // Redirect to the new group page
    res.redirect(`/study-groups/${groupId}`);
  } catch (err) {
    console.error("Error creating study group:", err);
    res.status(500).send("Error creating study group");
  }
});

// View study group details
app.get("/study-groups/:id", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.session.user.id;
    
    // Get group details
    const group = new StudyGroup(groupId);
    const groupDetails = await group.getGroupDetails();
    
    if (!groupDetails) {
      return res.status(404).send("Study group not found");
    }
    
    // Check if user is a member
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    // If group is private and user is not a member, deny access
    if (groupDetails.IsPrivate && !membership) {
      return res.status(403).render("error", {
        message: "This is a private study group. You need to be a member to view it."
      });
    }
    
    // Get group members
    const members = await group.getGroupMembers();
    
    // Get upcoming sessions
    const sessions = await StudySession.getGroupSessions(groupId);
    
    // Format dates and times
    sessions.forEach(session => {
      session.formattedDate = formatDate(session.Date);
      session.formattedStartTime = formatTime(session.StartTime);
      session.formattedEndTime = formatTime(session.EndTime);
    });
    
    res.render("study-group-details", {
      group: groupDetails,
      members,
      sessions,
      user: req.session.user,
      isMember: !!membership,
      isCreator: membership && membership.Role === 'creator',
      isModerator: membership && (membership.Role === 'moderator' || membership.Role === 'creator')
    });
  } catch (err) {
    console.error("Error fetching study group details:", err);
    res.status(500).send("Error fetching study group details");
  }
});

// Join a study group
app.post("/study-groups/:id/join", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.session.user.id;
    
    // Check if user is already a member
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    if (membership) {
      req.session.messages = { info: ["You are already a member of this group."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Join the group
    const group = new StudyGroup(groupId);
    const result = await group.addMember(userId);
    
    if (result.success) {
      req.session.messages = { success: ["You have successfully joined the group!"] };
    } else {
      req.session.messages = { error: [result.message] };
    }
    
    res.redirect(`/study-groups/${groupId}`);
  } catch (err) {
    console.error("Error joining study group:", err);
    res.status(500).send("Error joining study group");
  }
});

// Leave a study group
app.post("/study-groups/:id/leave", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.session.user.id;
    
    // Check if user is a member
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    if (!membership) {
      req.session.messages = { error: ["You are not a member of this group."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Check if user is the creator
    if (membership.Role === 'creator') {
      req.session.messages = { error: ["As the creator, you cannot leave the group. You can delete it instead."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Leave the group
    const group = new StudyGroup(groupId);
    await group.removeMember(userId);
    
    req.session.messages = { success: ["You have left the group."] };
    res.redirect("/study-groups");
  } catch (err) {
    console.error("Error leaving study group:", err);
    res.status(500).send("Error leaving study group");
  }
});

// Delete a study group (creator only)
app.post("/study-groups/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.session.user.id;
    
    // Check if user is the creator
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    if (!membership || membership.Role !== 'creator') {
      req.session.messages = { error: ["Only the creator can delete the group."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Delete the group
    const group = new StudyGroup(groupId);
    await group.deleteGroup();
    
    req.session.messages = { success: ["The study group has been deleted."] };
    res.redirect("/study-groups");
  } catch (err) {
    console.error("Error deleting study group:", err);
    res.status(500).send("Error deleting study group");
  }
});

// ========== STUDY SESSION ROUTES ==========
// Create study session form
app.get("/study-groups/:groupId/sessions/create", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.session.user.id;
    
    // Check if user is a member
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    if (!membership) {
      req.session.messages = { error: ["You must be a member to create a session."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Get group details
    const group = new StudyGroup(groupId);
    const groupDetails = await group.getGroupDetails();
    
    res.render("create-study-session", {
      group: groupDetails,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error loading create study session form:", err);
    res.status(500).send("Error loading form");
  }
});

// Handle study session creation
app.post("/study-groups/:groupId/sessions/create", ensureAuthenticated, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.session.user.id;
    const { title, description, date, startTime, endTime, location, isOnline, meetingLink } = req.body;
    
    // Check if user is a member
    const membership = await StudyGroup.isUserMember(groupId, userId);
    
    if (!membership) {
      req.session.messages = { error: ["You must be a member to create a session."] };
      return res.redirect(`/study-groups/${groupId}`);
    }
    
    // Create the session
    const sessionId = await StudySession.createSession(
      groupId,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      isOnline === 'on',
      meetingLink,
      userId
    );
    
    req.session.messages = { success: ["Study session created successfully!"] };
    res.redirect(`/study-sessions/${sessionId}`);
  } catch (err) {
    console.error("Error creating study session:", err);
    res.status(500).send("Error creating study session");
  }
});

// View study session details
app.get("/study-sessions/:id", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.user.id;
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is a member of the group
    const membership = await StudyGroup.isUserMember(sessionDetails.GroupID, userId);
    
    // Get group details
    const group = new StudyGroup(sessionDetails.GroupID);
    const groupDetails = await group.getGroupDetails();
    
    // If group is private and user is not a member, deny access
    if (groupDetails.IsPrivate && !membership) {
      return res.status(403).render("error", {
        message: "This session belongs to a private study group. You need to be a member to view it."
      });
    }
    
    // Get session participants
    const participants = await session.getSessionParticipants();
    
    // Get session resources
    const resources = await session.getSessionResources();
    
    // Check if user is participating
    const isParticipating = await StudySession.isUserParticipant(sessionId, userId);
    
    // Format date and times
    sessionDetails.formattedDate = formatDate(sessionDetails.Date);
    sessionDetails.formattedStartTime = formatTime(sessionDetails.StartTime);
    sessionDetails.formattedEndTime = formatTime(sessionDetails.EndTime);
    
    res.render("study-session-details", {
      session: sessionDetails,
      group: groupDetails,
      participants,
      resources,
      user: req.session.user,
      isMember: !!membership,
      isCreator: sessionDetails.CreatorID === userId,
      isParticipating: !!isParticipating,
      participationStatus: isParticipating ? isParticipating.Status : null
    });
  } catch (err) {
    console.error("Error fetching study session details:", err);
    res.status(500).send("Error fetching study session details");
  }
});

// Join a study session
app.post("/study-sessions/:id/join", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.user.id;
    const status = req.body.status || 'attending';
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is a member of the group
    const membership = await StudyGroup.isUserMember(sessionDetails.GroupID, userId);
    
    if (!membership) {
      req.session.messages = { error: ["You must be a member of the group to join this session."] };
      return res.redirect(`/study-groups/${sessionDetails.GroupID}`);
    }
    
    // Join the session
    const result = await session.addParticipant(userId, status);
    
    if (result.success) {
      req.session.messages = { success: [result.message] };
    } else {
      req.session.messages = { error: [result.message] };
    }
    
    res.redirect(`/study-sessions/${sessionId}`);
  } catch (err) {
    console.error("Error joining study session:", err);
    res.status(500).send("Error joining study session");
  }
});

// Leave a study session
app.post("/study-sessions/:id/leave", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.user.id;
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is participating
    const isParticipating = await StudySession.isUserParticipant(sessionId, userId);
    
    if (!isParticipating) {
      req.session.messages = { error: ["You are not participating in this session."] };
      return res.redirect(`/study-sessions/${sessionId}`);
    }
    
    // Check if user is the creator
    if (sessionDetails.CreatorID === userId) {
      req.session.messages = { error: ["As the creator, you cannot leave the session. You can delete it instead."] };
      return res.redirect(`/study-sessions/${sessionId}`);
    }
    
    // Leave the session
    await session.removeParticipant(userId);
    
    req.session.messages = { success: ["You have left the session."] };
    res.redirect(`/study-groups/${sessionDetails.GroupID}`);
  } catch (err) {
    console.error("Error leaving study session:", err);
    res.status(500).send("Error leaving study session");
  }
});

// Delete a study session (creator only)
app.post("/study-sessions/:id/delete", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.user.id;
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is the creator
    if (sessionDetails.CreatorID !== userId) {
      req.session.messages = { error: ["Only the creator can delete the session."] };
      return res.redirect(`/study-sessions/${sessionId}`);
    }
    
    // Delete the session
    await session.deleteSession();
    
    req.session.messages = { success: ["The study session has been deleted."] };
    res.redirect(`/study-groups/${sessionDetails.GroupID}`);
  } catch (err) {
    console.error("Error deleting study session:", err);
    res.status(500).send("Error deleting study session");
  }
});

// Add resource to study session
app.post("/study-sessions/:id/resources/add", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.session.user.id;
    const { title, description, fileUrl, externalLink } = req.body;
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is participating
    const isParticipating = await StudySession.isUserParticipant(sessionId, userId);
    
    if (!isParticipating) {
      req.session.messages = { error: ["You must be a participant to add resources."] };
      return res.redirect(`/study-sessions/${sessionId}`);
    }
    
    // Add the resource
    await session.addResource(title, description, fileUrl, externalLink, userId);
    
    req.session.messages = { success: ["Resource added successfully!"] };
    res.redirect(`/study-sessions/${sessionId}`);
  } catch (err) {
    console.error("Error adding resource to study session:", err);
    res.status(500).send("Error adding resource");
  }
});

// Delete resource from study session
app.post("/study-sessions/:sessionId/resources/:resourceId/delete", ensureAuthenticated, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const resourceId = req.params.resourceId;
    const userId = req.session.user.id;
    
    // Get session details
    const session = new StudySession(sessionId);
    const sessionDetails = await session.getSessionDetails();
    
    if (!sessionDetails) {
      return res.status(404).send("Study session not found");
    }
    
    // Check if user is the creator of the session or the uploader of the resource
    const resources = await session.getSessionResources();
    const resource = resources.find(r => r.ResourceID == resourceId);
    
    if (!resource) {
      return res.status(404).send("Resource not found");
    }
    
    if (sessionDetails.CreatorID !== userId && resource.UploadedBy !== userId) {
      req.session.messages = { error: ["You don't have permission to delete this resource."] };
      return res.redirect(`/study-sessions/${sessionId}`);
    }
    
    // Delete the resource
    await session.removeResource(resourceId);
    
    req.session.messages = { success: ["Resource deleted successfully!"] };
    res.redirect(`/study-sessions/${sessionId}`);
  } catch (err) {
    console.error("Error deleting resource from study session:", err);
    res.status(500).send("Error deleting resource");
  }
});