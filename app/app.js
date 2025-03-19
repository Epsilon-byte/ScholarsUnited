// Import express.js
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const ensureAuthenticated = require("./services/authMiddleware"); // Ensure this path is correct

const { formatDate, formatTime } = require("./helper.js");

// Loads environment variables
dotenv.config();

// Create express app
const app = express();

// Middleware
// Location for css styling
app.use(express.static("app/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "supersecretkey",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 3600000 }, // 1 hour
    })
);

app.set('view engine', 'pug');
app.set('views', './app/views');

// Get the functions in the db.js file to use
const db = require('./services/db');

// Root route - Redirect to login if not authenticated
app.get("/", (req, res) => {
    if (req.session.user) {
        // If the user is already logged in, redirect to the dashboard
        return res.redirect("/dashboard");
    }
    // Otherwise, redirect to the login page
    res.redirect("/login");
});

// Import models
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

app.get("/", function(req,res){
    res.render("index");
});

// ========== USER ROUTES ==========
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
app.get("/events", ensureAuthenticated, async function (req, res) {
    try {
        const events = await Event.getAllEvents();

        // Format each event's date and time
        events.forEach(event => {
            event.date = formatDate(event.Date);
            event.time = formatTime(event.Time);
        });

        // Render the events template with the events data
        res.render("events", { events: events || [] });
    } catch (err) {
        console.error("Error fetching events:", err);
        res.render("events", { events: [] });
    }
});

// Route to display the event creation form
app.get("/events/create", ensureAuthenticated, function (req, res) {
    res.render("create-event");
});

// Route to handle the event creation form submission
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

app.get("/events/:id", ensureAuthenticated, async function (req, res) {
    const eventId = req.params.id;

    try {
        const event = await Event.getEventById(eventId);

        if (!event) {
            return res.status(404).send("Event not found");
        }

        // Format the date and time
        event.date = formatDate(event.Date);
        event.time = formatTime(event.Time);

        // Render the event details template
        res.render("event-details", { event });
    } catch (err) {
        console.error("Error fetching event details:", err);
        res.status(500).send("Error fetching event details");
    }
});

// ========== EVENT-PARTICIPANT ROUTES ==========
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
app.get("/messages/:userId", ensureAuthenticated, async function (req, res) {
    try {
        const messages = await Message.getMessages(req.params.userId);
        res.render("messaging", { messages: messages || [] });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.render("messaging", { messages: [] });
    }
});

app.post("/messages/send", ensureAuthenticated, function (req, res) {
    const { senderId, receiverId, content } = req.body;
    const message = new Message(senderId, receiverId, content);
    message.sendMessage()
        .then(() => {
            res.status(201).send("Message sent successfully");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error sending message");
        });
});

// ========== BUDDY REQUEST ROUTES ==========
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
// Mark a notification as read
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
  
  // Delete a notification
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

// ===== CALENDAR ROUTE ===== ///
app.get("/calendar", ensureAuthenticated, async function (req, res) {
    try {
        const events = await Event.getAllEvents();

        // Format each event's date and time
        events.forEach(event => {
            event.date = formatDate(event.Date);
            event.time = formatTime(event.Time);
        });

        // Render the calendar template with the events
        res.render("calendar", { events: events || [] });
    } catch (err) {
        console.error("Error fetching events:", err);
        res.render("calendar", { events: [] });
    }
});

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

// ====== LOGIN ROUTE ====== //
app.get("/login", (req, res) => {
    res.render("login", { messages: req.session.messages });
    req.session.messages = {}; // Clear messages after rendering
});

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
  
      // Set session data
      req.session.user = {
        id: user.UserID, // Use the correct field name (UserID)
        email: user.Email,
        fullName: user.FullName,
      };
  
      console.log("Session set:", req.session.user); // Debugging
      return res.redirect("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).send("Internal server error");
    }
  });

// ===== REGISTRATION ROUTE ====== //
app.get("/register", (req, res) => {
    res.render("register", { messages: req.session.messages });
    req.session.messages = {}; // Clear messages after rendering
});

app.post("/register", async (req, res) => {
    const { email, password, fullName, interests, hobbies, academic_info, time_frames } = req.body;
  
    try {
      // Check if email already exists
      const [existingUser] = await db.query("SELECT * FROM Users WHERE Email = ?", [email]);
      if (existingUser) {
        req.session.messages = { error: ["Email already in use."] };
        return res.redirect("/register");
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Generated Hash for New User:", hashedPassword);
  
      // Insert the new user into the database
      await db.query(
        "INSERT INTO Users (Email, Password, FullName, Interests, Hobbies, AcademicInfo, AvailableTime) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [email, hashedPassword, fullName, interests, hobbies, academic_info, time_frames]
      );
  
      console.log("✅ User successfully registered!");
      req.session.messages = { success: ["Registration successful. Please log in."] };
      return res.redirect("/login");
    } catch (err) {
      console.error("❌ Registration Error:", err);
      res.status(500).send("Server error");
    }
  });

// ====== LOGOUT ROUTE ====== //
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// ====== DASHBOARD ROUTE ====== //
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
      console.log("No session or user ID found, redirecting to login");
      return res.redirect("/login");
    }
  
    console.log("Session data:", req.session.user);
  
    try {
      // Fetch notifications for the logged-in user
      const notifications = await Notification.getNotificationsByUserId(req.session.user.id);
  
      // Fetch events for the dashboard
      const events = await Event.getUpcomingEvents();
  
      // Render the dashboard template with the data
      res.render("dashboard", {
        user: req.session.user,
        notifications: notifications || [], // Pass notifications to the template
        events: events || [], // Pass events to the template
        formatDate, // Pass the formatDate function
        formatTime, // Pass the formatTime function
      });
    } catch (err) {
      console.error("Dashboard Error:", err);
      res.status(500).send("Server error");
    }
  });

// Start server on port 3000
app.listen(3000, function () {
    console.log(`Server running at http://127.0.0.1:3000/`);
});