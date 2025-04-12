// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial theme
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (document.getElementById('theme-toggle-checkbox')) {
      document.getElementById('theme-toggle-checkbox').checked = true;
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Add event listener to theme toggle
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
      if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    });
  }
});
