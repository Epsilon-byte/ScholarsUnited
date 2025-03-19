// Example formatDate and formatTime functions in helper.js
function formatDate(dateString) {
    if (!dateString) return "No date specified";
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Format as needed
  }
  
  function formatTime(timeString) {
    if (!timeString) return "No time specified";
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as needed
  }

module.exports = { formatDate, formatTime };
