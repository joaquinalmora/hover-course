document.addEventListener('DOMContentLoaded', () => {
  const instrEl = document.querySelector('div[data-automation-id="promptOption"]');
  if (instrEl) {
    console.log('DETAIL PAGE INSTRUCTOR →', instrEl.textContent.trim());
  } else {
    console.log('DETAIL PAGE INSTRUCTOR → not found');
  }
});