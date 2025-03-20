// Function to format a date string into a more readable format
function formatDate(date) {
  // Define formatting options for the date
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  
  // Convert the input date string to a Date object and format it using the specified options
  return new Date(date).toLocaleDateString(undefined, options);
}

// Function to format a time string into a more readable format
function formatTime(time) {
  // Define formatting options for the time
  const options = { hour: '2-digit', minute: '2-digit' };
  
  // Create a Date object using a fixed date (1970-01-01) and the input time, then format it using the specified options
  return new Date(`1970-01-01T${time}`).toLocaleTimeString(undefined, options);
}

// Export the functions so they can be used in other modules
module.exports = { formatDate, formatTime };