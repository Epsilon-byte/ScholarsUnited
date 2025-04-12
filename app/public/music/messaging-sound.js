// ✅ Prevent double bindings
if (!window.__messagingSoundsSetup) {
    window.__messagingSoundsSetup = true;
  
    document.addEventListener('DOMContentLoaded', () => {
      const sendForm = document.querySelector('form[action="/messages/send"]');
      const deleteForms = document.querySelectorAll('form[action^="/messages/delete"]');
  
      const popSound = new Audio('/sounds/pop.mp3');
      const pifSound = new Audio('/sounds/pif.mp3');
  
      popSound.preload = 'auto';
      pifSound.preload = 'auto';
  
      // Unmute once user clicks
      document.body.addEventListener('click', () => {
        popSound.muted = false;
        pifSound.muted = false;
      }, { once: true });
  
      // Send form
      if (sendForm) {
        sendForm.addEventListener('submit', (e) => {
          e.preventDefault();
          popSound.currentTime = 0;
          popSound.play().catch(console.warn);
          setTimeout(() => {
            sendForm.submit();
          }, 500);
        });
      }
  
      // Delete forms
      deleteForms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          pifSound.currentTime = 0;
          pifSound.play().catch(console.warn);
          setTimeout(() => {
            form.submit();
          }, 500);
        });
      });
    });
  }
  