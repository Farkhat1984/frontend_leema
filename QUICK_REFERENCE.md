# QUICK REFERENCE GUIDE

## 🚀 Deployment Quick Start

### 1. Run Functional Tests
Use the comprehensive checklist in `PHASE10_COMPLETE_SUMMARY.md`
- 95+ test cases covering all features
- Located at line 150+ in PHASE10_COMPLETE_SUMMARY.md

### 2. Deploy to Staging
```bash
# Deploy files to staging server
# Test with real API backend
# Monitor for 24-48 hours
```

### 3. Deploy to Production
```bash
# Backup current production
# Deploy new version
# Run smoke tests
# Monitor error logs
```

---

## 📁 File Locations

### Constants
- `assets/js/constants/api-endpoints.js` - All API paths
- `assets/js/constants/app-constants.js` - Configuration (pagination, timeouts)
- `assets/js/constants/messages.js` - All user-facing text

### Security
- `assets/js/shared/security-utils.js` - Security utilities (12 functions)

### Core Utilities
- `assets/js/shared/common-utils.js` - Common utilities + security
- `assets/js/core/cache.js` - LRU caching
- `assets/js/core/auth.js` - Authentication

### Pages
- `assets/js/pages/shop/` - Shop pages
- `assets/js/pages/admin/` - Admin pages
- `assets/js/pages/user/` - User pages

---

## 🔧 Common Tasks

### Add New API Endpoint
1. Edit `assets/js/constants/api-endpoints.js`
2. Add new constant: `NEW_ENDPOINT: '/api/new'`
3. Use in code: `API_ENDPOINTS.NEW_ENDPOINT`

### Add New Error Message
1. Edit `assets/js/constants/messages.js`
2. Add to `MESSAGES.ERROR` object
3. Use in code: `MESSAGES.ERROR.YOUR_ERROR`

### Add New Constant
1. Edit `assets/js/constants/app-constants.js`
2. Add to appropriate section
3. Use in code: `APP_CONSTANTS.YOUR_CONSTANT`

### Use Security Functions
```javascript
// Escape HTML
SecurityUtils.escapeHtml(userInput)

// Sanitize HTML
SecurityUtils.sanitizeHtml(html)

// Validate file
SecurityUtils.validateFile(file)

// Rate limiting
SecurityUtils.rateLimiter('action:user123', 5, 60000)
```

### Use Validation
```javascript
// Email
CommonUtils.isValidEmail('user@example.com')

// Phone
CommonUtils.isValidPhone('+1234567890')

// URL
CommonUtils.isValidUrl('https://example.com')
```

---

## 🐛 Debugging

### Check Errors
- Errors logged to console in development only
- Check browser console (F12)
- Look for `[context]` prefix in logs

### Common Issues

**Issue:** API request fails
**Solution:** Check network tab, verify token, check API endpoint

**Issue:** XSS detected warning
**Solution:** Review input, use SecurityUtils.escapeHtml()

**Issue:** Rate limit hit
**Solution:** Wait 60 seconds or adjust limit in code

---

## 📊 Monitoring

### Check Cache Stats
```javascript
window.apiCache.getStats()
// Returns: { size, hits, misses, hitRate }
```

### Clear Cache
```javascript
window.apiCache.clear()
// Or by pattern:
window.apiCache.clearByPattern('/api/products')
```

### Performance
- Search debounced to 300ms
- DOM updates batched with requestAnimationFrame
- Cache TTL: 5 minutes (default)

---

## 📚 Documentation

### Main Documents
- `PROJECT_COMPLETE.md` - Overall project summary
- `REFACTORING_PROGRESS.md` - Detailed progress tracker
- `PHASE10_COMPLETE_SUMMARY.md` - Testing checklists
- `TODOLIST.md` - Task tracking

### Phase Reports
- `PHASE[1-10]_COMPLETE_SUMMARY.md` - Detailed phase info
- `PHASE[1-10]_COMPLETION_REPORT.txt` - Quick summaries

---

## 🔒 Security

### Input Sanitization
Always sanitize user input before:
- Displaying in HTML
- Sending to API
- Storing in localStorage

### File Uploads
- Max size: 5MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Use `SecurityUtils.validateFile(file)`

### API Requests
- Automatically sanitized via `CommonUtils.apiRequest()`
- Token validated on every request
- Network errors handled gracefully

---

## ⚡ Performance

### Best Practices
- Use debounce for search: `window.debounce(fn, 300)`
- Use throttle for scroll: `window.throttle(fn, 300)`
- Batch DOM updates: `CommonUtils.batchDOMUpdates(() => {...})`
- Use cache: `apiRequest(endpoint, 'GET', null, true)`

### Optimization Applied
- Search: Debounced 300ms
- Tables: DocumentFragment rendering
- Stats: Batched DOM updates
- API: LRU caching with 100 item limit

---

## 🎯 Testing

### Run All Tests
Use checklist in `PHASE10_COMPLETE_SUMMARY.md`:
1. Authentication (6 tests)
2. Shop features (40+ tests)
3. Admin features (40+ tests)
4. Security (8 tests)
5. Performance (6 tests)

### Manual Testing
1. Login as admin/shop/user
2. Test CRUD operations
3. Test file uploads
4. Test search/filter
5. Test pagination
6. Test WebSocket
7. Test error scenarios

---

## 🆘 Support

### Questions?
1. Check `PROJECT_COMPLETE.md` for overview
2. Check `PHASE10_COMPLETE_SUMMARY.md` for testing
3. Check phase-specific docs for details
4. Check code comments for context

### Issues?
1. Check browser console for errors
2. Check network tab for API issues
3. Verify token is valid
4. Clear cache if data is stale
5. Check error messages use MESSAGES constants

---

## 📝 Code Style

### Naming Conventions
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase` (verb-noun)
- Files: `kebab-case.js`

### Error Handling
- Always use try-catch for async operations
- Use MESSAGES.ERROR constants
- Log errors in development only
- Show user-friendly messages

### Comments
- Avoid obvious comments
- Document complex logic
- Use JSDoc for public APIs (future)

---

## ✅ Checklist Before Deploy

- [ ] All tests passed
- [ ] No console errors
- [ ] API integration working
- [ ] WebSocket connected
- [ ] File uploads working
- [ ] All features tested
- [ ] Staging tested (24-48h)
- [ ] Backup created
- [ ] Ready to deploy

---

**Last Updated:** 2025-10-24  
**Version:** 1.0 (Production Ready)  
**Status:** Ready to Deploy ✅
