function formatDate(dateString) {
    if (!dateString) return "Invalid Date";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date"; // Handle invalid date conversion

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeString) {
    if (!timeString) return "Invalid Time";

    // Some databases return time as HH:MM:SS, need to parse correctly
    const [hours, minutes] = timeString.split(":");
    if (!hours || !minutes) return "Invalid Time";

    return `${hours}:${minutes}`; // Simple HH:MM format
}

module.exports = { formatDate, formatTime };
