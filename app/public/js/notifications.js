// Client-side socket.io integration for real-time notifications
document.addEventListener('DOMContentLoaded', function() {
  // Check if socket.io is loaded
  if (typeof io === 'undefined') {
    console.error('Socket.io not loaded');
    return;
  }
  
  // Connect to the socket server
  const socket = io();
  
  // Get current user ID from data attribute
  const currentUserId = document.body.getAttribute('data-current-user-id');
  
  if (currentUserId) {
    // Authenticate with the socket server
    socket.emit('authenticate', currentUserId);
    
    // Listen for notifications
    socket.on('notification', function(notification) {
      // Create notification element
      showNotification(notification);
      
      // Update notification badge count
      updateNotificationCount();
      
      // Play notification sound
      playNotificationSound();
    });
  }
  
  // Function to display a notification
  function showNotification(notification) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-toast';
    
    // Add notification content
    notificationElement.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">${notification.title || 'New Notification'}</span>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-body">
        ${notification.message || ''}
      </div>
    `;
    
    // Add click event to close button
    const closeButton = notificationElement.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
      notificationContainer.removeChild(notificationElement);
    });
    
    // Add click event to notification body to navigate to the target URL
    if (notification.url) {
      notificationElement.querySelector('.notification-body').addEventListener('click', function() {
        window.location.href = notification.url;
      });
      notificationElement.querySelector('.notification-body').style.cursor = 'pointer';
    }
    
    // Add notification to container
    notificationContainer.appendChild(notificationElement);
    
    // Auto-remove notification after 5 seconds
    setTimeout(function() {
      if (notificationElement.parentNode === notificationContainer) {
        notificationContainer.removeChild(notificationElement);
      }
    }, 5000);
  }
  
  // Function to update notification count in the UI
  function updateNotificationCount() {
    // Get notification count element
    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
      // Get current count
      let count = parseInt(notificationCountElement.textContent) || 0;
      
      // Increment count
      count += 1;
      
      // Update count
      notificationCountElement.textContent = count;
      
      // Show count if it was hidden
      notificationCountElement.style.display = count > 0 ? 'block' : 'none';
    }
  }
  
  // Function to play notification sound
  function playNotificationSound() {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }
});
