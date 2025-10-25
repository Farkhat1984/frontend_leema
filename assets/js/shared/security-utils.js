/**
 * Security Utilities
 * Provides XSS protection, input sanitization, and validation
 */

const SecurityUtils = (() => {
  /**
   * Escapes HTML special characters to prevent XSS attacks
   * @param {string} str - String to escape
   * @returns {string} - Escaped string safe for HTML insertion
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /**
   * Sanitizes HTML by removing dangerous tags and attributes
   * @param {string} html - HTML string to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} - Sanitized HTML
   */
  function sanitizeHtml(html, options = {}) {
    if (!html) return '';
    
    const allowedTags = options.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'];
    const allowedAttrs = options.allowedAttrs || ['class'];
    
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove script tags and their content
    const scripts = div.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove event handlers (onclick, onerror, etc.)
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove event handler attributes
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        // Remove non-allowed attributes
        if (!allowedAttrs.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
      
      // Remove javascript: protocols
      ['href', 'src', 'action'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value && value.toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr);
        }
      });
      
      // Remove non-allowed tags
      if (!allowedTags.includes(el.tagName.toLowerCase())) {
        el.replaceWith(...el.childNodes);
      }
    });
    
    return div.innerHTML;
  }

  /**
   * Creates safe HTML from template and data
   * @param {string} template - HTML template
   * @param {Object} data - Data to insert (will be escaped)
   * @returns {string} - Safe HTML
   */
  function createSafeHtml(template, data = {}) {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, escapeHtml(value));
    }
    
    return result;
  }

  /**
   * Validates and sanitizes input based on type
   * @param {any} value - Value to sanitize
   * @param {string} type - Type of sanitization (text, number, email, url)
   * @returns {any} - Sanitized value
   */
  function sanitizeInput(value, type = 'text') {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
        
      case 'integer':
        return parseInt(value, 10) || 0;
        
      case 'email':
        // Remove dangerous characters from email
        return String(value).replace(/[<>"']/g, '').trim().toLowerCase();
        
      case 'url':
        // Basic URL sanitization
        const url = String(value).trim();
        if (url.toLowerCase().startsWith('javascript:')) return '';
        if (url.toLowerCase().startsWith('data:')) return '';
        return url;
        
      case 'alpha':
        // Only letters and spaces
        return String(value).replace(/[^a-zA-Z\s]/g, '');
        
      case 'alphanumeric':
        // Letters, numbers, and spaces
        return String(value).replace(/[^a-zA-Z0-9\s]/g, '');
        
      case 'text':
      default:
        // Remove control characters but keep text
        return String(value).replace(/[\x00-\x1F\x7F]/g, '');
    }
  }

  /**
   * Validates file upload for security
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} - {valid: boolean, error: string}
   */
  function validateFile(file, options = {}) {
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB` };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    // Check file extension matches MIME type
    const ext = file.name.split('.').pop().toLowerCase();
    const mimeToExt = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp']
    };
    
    const expectedExts = mimeToExt[file.type] || [];
    if (!expectedExts.includes(ext)) {
      return { valid: false, error: 'File extension does not match type' };
    }
    
    return { valid: true };
  }

  /**
   * Checks if a string contains potential XSS patterns
   * @param {string} str - String to check
   * @returns {boolean} - True if potentially dangerous
   */
  function containsXss(str) {
    if (!str) return false;
    
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // event handlers
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
      /eval\(/gi,
      /expression\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Safely sets text content (prevents XSS)
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to set
   */
  function setTextContent(element, text) {
    if (element && text !== null && text !== undefined) {
      element.textContent = String(text);
    }
  }

  /**
   * Safely sets HTML content after sanitization
   * @param {HTMLElement} element - Target element
   * @param {string} html - HTML to set
   * @param {Object} options - Sanitization options
   */
  function setHtmlContent(element, html, options = {}) {
    if (element && html) {
      element.innerHTML = sanitizeHtml(html, options);
    }
  }

  /**
   * Creates a DOM element safely from HTML string
   * @param {string} html - HTML string
   * @param {Object} options - Sanitization options
   * @returns {HTMLElement} - Created element
   */
  function createElementFromHtml(html, options = {}) {
    const div = document.createElement('div');
    div.innerHTML = sanitizeHtml(html, options);
    return div.firstElementChild;
  }

  /**
   * Rate limiting utility
   * @param {string} key - Unique key for this action
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} - True if allowed, false if rate limited
   */
  const rateLimiter = (() => {
    const attempts = new Map();
    
    return (key, maxAttempts = 5, windowMs = 60000) => {
      const now = Date.now();
      const record = attempts.get(key) || { count: 0, resetTime: now + windowMs };
      
      // Reset if window expired
      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
      }
      
      record.count++;
      attempts.set(key, record);
      
      return record.count <= maxAttempts;
    };
  })();

  /**
   * Validates CSRF token (if implemented)
   * @param {string} token - Token to validate
   * @returns {boolean} - True if valid
   */
  function validateCsrfToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token && storedToken && token === storedToken;
  }

  /**
   * Generates a random CSRF token
   * @returns {string} - Random token
   */
  function generateCsrfToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  // Public API
  return {
    escapeHtml,
    sanitizeHtml,
    createSafeHtml,
    sanitizeInput,
    validateFile,
    containsXss,
    setTextContent,
    setHtmlContent,
    createElementFromHtml,
    rateLimiter,
    validateCsrfToken,
    generateCsrfToken
  };
})();

// Expose globally
window.SecurityUtils = SecurityUtils;
