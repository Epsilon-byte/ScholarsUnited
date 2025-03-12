// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

//Use the Pug templating engine
app.set('view engine','pug');
app.set('views','./app/views');

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
app.get("/courses", function (req, res) {
    Course.getAllCourses()
        .then(courses => {
            res.json(courses);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching courses");
        });
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
app.get("/messages/:userId", function (req, res) {
    Message.getMessages(req.params.userId)
        .then(messages => {
            res.json(messages);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching messages");
        });
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
    Notification.getNotificationsByUserId(req.params.userId)
        .then(notifications => {
            res.json(notifications);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Error fetching notifications");
        });
});
// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});