// Helper function to format the date (YYYY-MM-DD)
function formatDate(date) {
    const d = new Date(date);
    
    // Check if the date is valid
    if (isNaN(d.getTime())) {
        console.error("Invalid date:", date);
        return "Invalid Date"; // Return a fallback value for invalid dates
    }
    
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

// Helper function to format the time (HH:MM)
function formatTime(time) {
    const t = new Date(`1970-01-01T${time}Z`); // Ensure that the time is treated as UTC
    
    // Check if the time is valid
    if (isNaN(t.getTime())) {
        console.error("Invalid time:", time);
        return "Invalid Time"; // Return a fallback value for invalid times
    }

    return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
}
