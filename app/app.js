// Imports required modules
const express = require("express"); // Express framework for building the server
const session = require("express-session"); // Session middleware for managing user sessions
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const bodyParser = require("body-parser"); // Middleware for parsing request bodies
const dotenv = require("dotenv"); // Loads environment variables from a .env file
const ensureAuthenticated = require("./services/authMiddleware"); // Custom middleware to ensure user authentication

// Imports helper functions for formatting date and time
const { formatDate, formatTime } = require("./helper.js");

// Loads the environment variables from .env file
dotenv.config();

// Creates an Express application
const app = express();

// ========== MIDDLEWARE SETUP ==========
// Serves static files (e.g., CSS) from the "app/public" directory
app.use(express.static("app/public"));

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


// Sets the view engine to Pug and specify the views directory
app.set('view engine', 'pug');
app.set('views', './app/views');

// Imports database functions from db.js
const db = require('./services/db');

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

// Imports models for database interactions
const { User } = require("./models/user");
const { Interest } = require("./models/interest");
const { UserInterest } = require("./models/user-interest");
const { Course } = require("./models/course");
const { UserCourse } = require("./models/user-course");
const { Event } = require("./models/event");
const { EventParticipant } = require("./models/event-participant");
const { Message } = require("./models/message");
const { BuddyRequest } = require("./models/buddy-request");
const { Notification } = require("./models/notification");

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

// ========== EVENT ROUTES ==========
// Fetches all events and render the events page
app.get("/events", ensureAuthenticated, async function (req, res) {
    try {
        const events = await Event.getAllEvents();

        // Formats each event's date and time
        events.forEach(event => {
            event.date = formatDate(event.Date);
            event.time = formatTime(event.Time);
        });

        // Renders the events template with the formatted events
        res.render("events", { events: events || [] });
    } catch (err) {
        console.error("Error fetching events:", err);
        res.render("events", { events: [] });
    }
});

// Renders the event creation form
app.get("/events/create", ensureAuthenticated, function (req, res) {
    res.render("create-event");
});

// Handles event creation form submission
app.post("/events/create", ensureAuthenticated, async function (req, res) {
    const { title, description, date, time, location, userId } = req.body;

    try {
        const eventId = await Event.createEvent(title, description, date, time, location, userId);
        console.log("Event created with ID:", eventId);
        res.redirect("/events");
    } catch (err) {
        console.error("Error creating event:", err);
        res.status(500).send("Error creating event");
    }
});

// Fetches event details by ID and render the event details page
app.get("/events/:id", ensureAuthenticated, async function (req, res) {
    const eventId = req.params.id;

    try {
        const event = await Event.getEventById(eventId);
        if (!event) return res.status(404).send("Event not found");

        event.date = formatDate(event.Date);
        event.time = formatTime(event.Time);

        const eventInstance = new Event(eventId);
        const participants = await eventInstance.getEventParticipants();

        const userId = req.session.user.id;
        const hasJoined = participants.some(p => p.UserID === userId);

        res.render("event-details", {
            event,
            user: req.session.user,
            participants,
            hasJoined
        });
    } catch (err) {
        console.error("Error fetching event details:", err);
        res.status(500).send("Error fetching event details");
    }
});

// ========== EVENT-PARTICIPANT ROUTES ==========
// Fetches participants for a specific event
app.get("/event-participants/:eventId", ensureAuthenticated, function (req, res) {
    EventParticipant.getParticipantsByEventId(req.params.eventId)
        .then(participants => {
            res.json(participants);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching event participants");
        });
});
// ========== MESSAGE ROUTES ==========

// Show messages for the current user
app.get("/messaging", ensureAuthenticated, async (req, res) => {
    console.log("✅ /messaging route hit!");
  
    const userId = req.session.user.id;
  
    try {
      const rawMessages = await Message.getMessages(userId);
  
      const messages = rawMessages.map(msg => ({
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
      console.error("❌ Error fetching messages:", err);
      res.render("messaging", { messages: [], user: req.session.user });
    }
  });
  
  // Show messages for any user (admin/debug)
  app.get("/messages/:userId", ensureAuthenticated, async (req, res) => {
    const targetUserId = req.params.userId;
  
    try {
      const rawMessages = await Message.getMessages(targetUserId);
  
      const messages = rawMessages.map(msg => ({
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
      console.error("❌ Error fetching messages:", err);
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
      console.error("❌ Error sending message:", err);
      res.status(500).send("Error sending message");
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
    res.render("login", { messages: req.session.messages });
    req.session.messages = {}; // Clear messages after rendering
});

// Handles login form submission
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            console.log("❌ User not found in database!");
            return res.status(401).send("Invalid email or password");
        }

        console.log("✅ User found:", user); // Debugging

        const match = await bcrypt.compare(password, user.Password);
        if (!match) {
            console.log("❌ Password mismatch!");
            return res.status(401).send("Invalid email or password");
        }

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
    res.render("register", { messages: req.session.messages });
    req.session.messages = {}; // Clear messages after rendering
});

// Handles registration form submission
app.post("/register", async (req, res) => {
    const { email, password, fullName, interests, hobbies, academic_info, time_frames } = req.body;

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
  
      // ✅ Inject formatted interests string
      userDetails.Interests = Array.isArray(userInterests)
        ? userInterests.join(", ")
        : userDetails.Interests;
  
      console.log("✅ userDetails being passed to PUG:");
      console.log(userDetails);
  
      res.render("profile", {
        user: req.session.user,
        userDetails,
        messages: req.session.messages || {}
      });
  
      req.session.messages = {};
    } catch (err) {
      console.error("❌ Could not load profile", err);
      req.session.messages = { error: ["Could not load your profile."] };
      res.redirect("/dashboard");
    }
  });
  
  
  // POST: Handle Profile Updates
  app.post("/profile/update", ensureAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const { interests, courses, free_time } = req.body;
  
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
      req.session.messages = { error: ["Error updating profile."] };
      res.redirect("/profile");
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


// Starts the server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});