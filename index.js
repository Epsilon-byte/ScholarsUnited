"use strict";

// Include the app.js file.
// This will run the code.
console.log("entrypoint");
const app = require("./app/app.js");
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const socketService = require('./app/services/socketService');

// Get environment variables
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Create HTTP server (always created as fallback)
const httpServer = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = socketService.initializeSocketIO(httpServer);

// Make io available globally
app.io = io;

// Start HTTP server
httpServer.listen(PORT, () => {
  console.log(`HTTP server running at http://127.0.0.1:${PORT}/`);
});

// Try to create HTTPS server if enabled
if (USE_HTTPS) {
  try {
    // Check for SSL certificates
    const sslDir = path.join(__dirname, 'app', 'ssl');
    const keyPath = path.join(sslDir, 'server.key');
    const certPath = path.join(sslDir, 'server.crt');
    
    // Generate certificates if they don't exist
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('SSL certificates not found. Generating them now...');
      
      // Run the certificate generation script
      try {
        require('./app/ssl/generate-cert');
      } catch (genError) {
        console.error('Failed to generate SSL certificates:', genError);
        console.log('HTTPS server will not be started.');
        return;
      }
    }
    
    // Check again if certificates exist after generation attempt
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error('SSL certificates still not found after generation attempt.');
      console.log('HTTPS server will not be started.');
      return;
    }
    
    // SSL options
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    // Create HTTPS server
    const httpsServer = https.createServer(sslOptions, app);
    
    // Share the Socket.IO instance with the HTTPS server
    io.attach(httpsServer);
    
    // Start HTTPS server
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running at https://127.0.0.1:${HTTPS_PORT}/`);
      console.log('Note: Self-signed certificates will show a browser warning.');
    });
    
    // Handle HTTPS server errors
    httpsServer.on('error', (error) => {
      console.error('HTTPS server error:', error);
      if (error.code === 'EACCES') {
        console.log('Permission denied. Try running with administrator privileges or use a different port.');
      } else if (error.code === 'EADDRINUSE') {
        console.log(`Port ${HTTPS_PORT} is already in use. Try a different port.`);
      }
    });
  } catch (error) {
    console.error('Error setting up HTTPS server:', error);
    console.log('Continuing with HTTP server only.');
  }
}