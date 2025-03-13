// Import express.js
const express = require("express");

const { formatDate, formatTime } = require("/src/helper.js");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

app.set('view engine', 'pug');
app.set('views', './app/views');

// Get the functions in the db.js file to use
const db = require('./services/db');

app.get("/", function(req,res){
    res.render("index");
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

// ========== USER ROUTES ==========
app.get("/users/:id", function (req, res) {
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

app.delete("/users/:id", function (req, res) {
    User.deleteUser(req.params.id)
        .then(result => {
            res.json(result);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error deleting user");
        });
});

app.get("/users/search/:query", function (req, res) {
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
app.get("/interests", function (req, res) {
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
app.get("/user-interests/:userId", function (req, res) {
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
app.get("/courses", async function (req, res) {
    try {
        const courses = await Course.getAllCourses();  // Await the result from getAllCourses
        res.json(courses);  // Send the courses as a JSON response
    } catch (err) {
        console.error(err);  // Log any errors to the console
        res.status(500).send("Error fetching courses");  // Return a 500 status and error message
    }
});


// ========== USER-COURSE ROUTES ==========
app.get("/user-courses/:userId", function (req, res) {
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
app.get("/events", function (req, res) {
    Event.getAllEvents()
        .then(events => {
            res.json(events);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching events");
        });
});

// ========== EVENT-PARTICIPANT ROUTES ==========
app.get("/event-participants/:eventId", function (req, res) {
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
app.get("/messages/:userId", async function (req, res) {
    try {
        const messages = await Message.getMessages(req.params.userId);
        console.log("Fetched Messages:", messages); // Debugging output

        // Ensure messages is always an array before rendering
        res.render("messaging", { messages: messages || [] });
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.render("messaging", { messages: [] }); // Ensure empty array if error
    }
});

app.post("/messages/send", function (req, res) {
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
app.get("/buddyRequests/sent/:userId", function (req, res) {
    BuddyRequest.getSentRequests(req.params.userId)
        .then(requests => {
            res.json(requests);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching sent buddy requests");
        });
});

app.get("/buddyRequests/received/:userId", function (req, res) {
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
app.get("/notifications/:userId", function (req, res) {
    // Ensure userId is provided in the request and it's a valid number
    const userId = req.params.userId;

    if (!userId || isNaN(userId)) {
        return res.status(400).send("Invalid UserID");
    }

    // Call the method to get notifications for the given user
    Notification.getNotificationsByUserId(userId)
        .then(notifications => {
            if (notifications.length === 0) {
                return res.status(404).send("No notifications found for this user");
            }
            res.json(notifications); // Return the notifications as JSON
        })
        .catch(err => {
            console.error("Error fetching notifications:", err);
            res.status(500).send("Error fetching notifications"); // Internal Server Error
        });
});


app.get("/calendar", async function (req, res) {
    try {
        // Fetch events from the database
        const events = await Event.getAllEvents();

        // Format each event's date and time
        events.forEach(event => {
            console.log("Original event:", event);  // Debugging log

            event.date = formatDate(event.date);
            event.time = formatTime(event.time);
        });

        // Render the calendar template with the events
        res.render("calendar", { events: events || [] });
    } catch (err) {
        console.error("Error fetching events:", err);
        res.render("calendar", { events: [] });  // Fallback to empty events if error occurs
    }
});


app.get("/dashboard", async function (req, res) {
    try {
        const upcomingEvents = await Event.getUpcomingEvents();
        console.log("Fetched Upcoming Events:", upcomingEvents);
        res.render("dashboard", { upcomingEvents: upcomingEvents || [], errorMessage: null });
    } catch (err) {
        console.error("Error fetching upcoming events:", err);
        res.render("dashboard", { upcomingEvents: [], errorMessage: "Failed to fetch upcoming events. Please try again later." });
    }
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});