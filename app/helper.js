// Format a date object or string to readable format
function formatDate(date) {
  const parsed = new Date(date);
  return isNaN(parsed) ? "Invalid Date" : parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format time string (HH:mm:ss) to 12-hour or 24-hour readable format
function formatTime(time) {
  const parsed = new Date(`1970-01-01T${time}`);
  return isNaN(parsed) ? "Invalid Time" : parsed.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = { formatDate, formatTime };
