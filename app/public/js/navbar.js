// Simple direct navbar functionality
function toggleMenu() {
  console.log('Toggle menu clicked');
  const drawer = document.getElementById('menuDrawer');
  const overlay = document.getElementById('overlay');
  if (drawer && overlay) {
    if (drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
    } else {
      drawer.classList.add('open');
      overlay.classList.add('show');
    }
  }
}

// Make sure the function is globally available
window.toggleMenu = toggleMenu;

// Set up all event handlers when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, setting up navbar handlers');
  
  // Set up menu toggle button
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    console.log('Menu toggle button found');
    menuToggle.onclick = function(e) {
      e.preventDefault();
      toggleMenu();
    };
  } else {
    console.error('Menu toggle button not found');
  }
  
  // Set up menu close button
  const menuClose = document.querySelector('.menu-close');
  if (menuClose) {
    menuClose.onclick = function(e) {
      e.preventDefault();
      toggleMenu();
    };
  }
  
  // Set up overlay click
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.onclick = toggleMenu;
  }
  
  // Set up menu links
  document.querySelectorAll('.menu-links a').forEach(link => {
    link.addEventListener('click', () => {
      const drawer = document.getElementById('menuDrawer');
      const overlay = document.getElementById('overlay');
      if (drawer && overlay) {
        drawer.classList.remove('open');
        overlay.classList.remove('show');
      }
    });
  });
});
