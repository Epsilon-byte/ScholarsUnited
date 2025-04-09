require("dotenv").config(); // Load environment variables from .env file


const mysql = require('mysql2'); // Import mysql2 package


const db = mysql.createPool({ // Create a connection pool
  host: process.env.DB_CONTAINER,
    port: process.env.DB_PORT,
    user: process.env.MYSQL_ROOT_USER,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});


module.exports = db.promise(); // Export the promise pool
