# Performance Utilities - Quick Reference Guide

## New Global Functions

### 1. Debounce - `window.debounce(func, delay)`

Delays function execution until after a specified time has passed since the last call.

**Use Cases:**
- Search inputs
- Form validation
- Window resize handlers
- Auto-save functionality

**Example:**
```javascript
// Debounce search input (wait for user to stop typing)
const debouncedSearch = window.debounce(() => {
    performSearch();
}, 300);

document.getElementById('searchInput').addEventListener('input', debouncedSearch);
```

---

### 2. Throttle - `window.throttle(func, limit)`

Limits function execution to once per specified time period.

**Use Cases:**
- Scroll events
- Mouse move events
- API rate limiting
- Animation updates

**Example:**
```javascript
// Throttle scroll handler (execute max once per 100ms)
const throttledScroll = window.throttle(() => {
    updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

---

### 3. Batch DOM Updates - `CommonUtils.batchDOMUpdates(updates)`

Batches multiple DOM updates into a single requestAnimationFrame callback to minimize reflows.

**Use Cases:**
- Multiple element updates
- Statistics updates
- Dynamic styling
- Layout changes

**Example:**
```javascript
// Update multiple elements efficiently
CommonUtils.batchDOMUpdates(() => {
    document.getElementById('count').textContent = '100';
    document.getElementById('total').textContent = '$1,000';
    document.getElementById('status').style.display = 'block';
    // All updates happen in single reflow
});
```

---

### 4. Document Fragment - `CommonUtils.createDocumentFragment(htmlArray)`

Creates a DocumentFragment from an array of HTML strings for efficient bulk DOM insertion.

**Use Cases:**
- Rendering lists
- Table rows
- Product cards
- Any bulk DOM insertion

**Example:**
```javascript
// Render table rows efficiently
const rows = data.map(item => `
    <tr>
        <td>${item.name}</td>
        <td>${item.value}</td>
    </tr>
`);

const tbody = document.getElementById('tableBody');
tbody.innerHTML = ''; // Clear existing
tbody.appendChild(CommonUtils.createDocumentFragment(rows));
```

---

### 5. Enhanced Cache - `window.apiCache`

Enhanced cache manager with LRU eviction and pattern-based clearing.

**Use Cases:**
- API response caching
- Expensive calculation results
- User session data
- Temporary data storage

**Methods:**
```javascript
// Set cache entry with TTL
window.apiCache.set('products', data, 60000); // 60 seconds

// Get cache entry
const products = window.apiCache.get('products');

// Check if exists
if (window.apiCache.has('products')) {
    // Use cached data
}

// Clear by pattern
window.apiCache.clearByPattern(/products/);

// Get statistics
const stats = window.apiCache.getStats();
console.log(`Cache: ${stats.size}/${stats.maxSize}`);

// Manual cleanup
window.apiCache.clearExpired();
```

---

## Performance Patterns

### Pattern 1: Debounced Search

```javascript
// In your page initialization
const debouncedFilter = window.debounce(() => {
    const query = document.getElementById('search').value;
    filterResults(query);
}, 300);

document.getElementById('search').addEventListener('input', debouncedFilter);
```

### Pattern 2: Throttled Scroll

```javascript
const throttledScroll = window.throttle(() => {
    const scrollTop = window.pageYOffset;
    updateNavbar(scrollTop);
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### Pattern 3: Batch Statistics Update

```javascript
function updateDashboard(data) {
    CommonUtils.batchDOMUpdates(() => {
        document.getElementById('users').textContent = data.users;
        document.getElementById('orders').textContent = data.orders;
        document.getElementById('revenue').textContent = data.revenue;
        document.getElementById('growth').textContent = data.growth;
    });
}
```

### Pattern 4: Efficient List Rendering

```javascript
function renderProductList(products) {
    const container = document.getElementById('products');
    
    const cards = products.map(product => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p>${product.price}</p>
        </div>
    `);
    
    container.innerHTML = '';
    container.appendChild(CommonUtils.createDocumentFragment(cards));
}
```

### Pattern 5: Cached API Calls

```javascript
async function getProducts() {
    // Check cache first
    const cached = window.apiCache.get('products');
    if (cached) {
        return cached;
    }
    
    // Fetch from API
    const response = await fetch('/api/products');
    const data = await response.json();
    
    // Cache for 5 minutes
    window.apiCache.set('products', data, 300000);
    
    return data;
}
```

---

## Best Practices

### ✅ DO:
- Use debounce for user input handlers
- Use throttle for high-frequency events
- Batch multiple DOM updates together
- Use DocumentFragment for bulk insertions
- Cache expensive API calls
- Clear cache when data changes

### ❌ DON'T:
- Debounce click handlers (use normal handlers)
- Throttle form submissions (can lose data)
- Batch updates that need immediate feedback
- Cache sensitive user data in browser
- Set cache TTL too long (stale data risk)

---

## Performance Tips

1. **Debounce Delay:** 
   - 300ms for search inputs
   - 500ms for auto-save
   - 150ms for validation

2. **Throttle Limit:**
   - 100ms for scroll events
   - 16ms for animations (60fps)
   - 300ms for API calls

3. **Cache TTL:**
   - 60s for frequently changing data
   - 300s (5min) for stable data
   - 3600s (1hr) for rarely changing data

4. **DocumentFragment:**
   - Use for 10+ elements
   - Faster than innerHTML for large lists
   - Maintains event listeners

---

## Debugging

### Check if utilities are loaded:
```javascript
console.log('Debounce:', typeof window.debounce); // 'function'
console.log('Throttle:', typeof window.throttle); // 'function'
console.log('Cache:', typeof window.apiCache); // 'object'
```

### Monitor cache usage:
```javascript
const stats = window.apiCache.getStats();
console.log('Cache usage:', stats.size, '/', stats.maxSize);
console.log('Cache keys:', stats.keys);
```

### Test debounce timing:
```javascript
const debounced = window.debounce(() => {
    console.log('Executed at:', new Date().toISOString());
}, 300);

// Call multiple times quickly
debounced(); // Won't execute
debounced(); // Won't execute
debounced(); // Will execute after 300ms
```

---

## Browser Compatibility

All utilities are compatible with:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

**Polyfills:** None required

---

## Migration Guide

### From setTimeout to debounce:
```javascript
// Before
let timeout;
input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        search();
    }, 300);
});

// After
const debouncedSearch = window.debounce(search, 300);
input.addEventListener('input', debouncedSearch);
```

### From manual batching to batchDOMUpdates:
```javascript
// Before
const updates = () => {
    elem1.textContent = val1;
    elem2.textContent = val2;
    elem3.textContent = val3;
};
requestAnimationFrame(updates);

// After
CommonUtils.batchDOMUpdates(() => {
    elem1.textContent = val1;
    elem2.textContent = val2;
    elem3.textContent = val3;
});
```

---

**Last Updated:** 2025-10-24  
**Version:** 1.0  
**Phase:** 7 - Performance Optimization
