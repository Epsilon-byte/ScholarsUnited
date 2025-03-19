
// helper.js
function formatDate(date) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
}

function formatTime(time) {
  const options = { hour: '2-digit', minute: '2-digit' };
  return new Date(`1970-01-01T${time}`).toLocaleTimeString(undefined, options);
}

module.exports = { formatDate, formatTime };
