// Upload service for handling file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads');
const profilePicturesDir = path.join(uploadDir, 'profile-pictures');

// Ensure directories exist
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(profilePicturesDir);

// Configure storage for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicturesDir);
  },
  filename: function (req, file, cb) {
    // Use user ID and timestamp to create unique filename
    const userId = req.session.user.id;
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${userId}_${timestamp}${fileExtension}`);
  }
});

// File filter for images
const imageFilter = function (req, file, cb) {
  // Accept only image files
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create multer upload middleware for profile pictures
const profilePictureUpload = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
}).single('profilePicture');

module.exports = {
  profilePictureUpload,
  profilePicturesDir
};
