// Tailwind CSS CDN configuration - suppress production warnings
// This must run BEFORE tailwind CDN script loads
(function() {
  // Store original console.warn
  const originalWarn = console.warn;
  
  // Override console.warn to suppress Tailwind CDN warning
  console.warn = function(...args) {
    const msg = args[0];
    if (msg && typeof msg === 'string' && 
        (msg.includes('cdn.tailwindcss.com') || 
         msg.includes('Tailwind CSS') ||
         msg.includes('PostCSS plugin'))) {
      return; // Suppress Tailwind CDN warnings
    }
    originalWarn.apply(console, args);
  };
})();

// Tailwind config - will be set after Tailwind CDN loads
window.addEventListener('DOMContentLoaded', function() {
  if (typeof tailwind !== 'undefined') {
    tailwind.config = {
      corePlugins: {
        preflight: true,
      }
    };
  }
});
