# Activity Logs - Admin Panel

## 📋 Overview

Complete audit trail system for tracking all user actions, admin activities, and system events on the Fashion AI Platform.

## ✨ Features

### Core Functionality
- **Complete Audit Trail** - Track every action in the system
- **User Actions Tracking** - Monitor customer and shop activities
- **Admin Actions Log** - Audit administrative operations
- **System Events** - Track automated system processes
- **Real-time Updates** - Live log streaming with timestamps

### Advanced Search & Filtering
- **Text Search** - Search by user, action, or details
- **Action Type Filter** - Filter by create, update, delete, login, logout, approve, reject, refund
- **Actor Type Filter** - Filter by user, shop, admin, or system
- **Date Range Filters** - Today, yesterday, 7/30/90 days, or custom range
- **Custom Date Range** - Select specific start and end dates

### Log Details
- **Actor Information**
  - Type (user/shop/admin/system)
  - Name and email
  - Actor ID
- **Action Details**
  - Action type with color-coded badges
  - Resource type and name
  - Detailed description
- **Technical Information**
  - IP address tracking
  - User agent logging
  - Timestamp (relative and absolute)
- **Metadata**
  - Previous values (for updates)
  - New values (for updates)
  - Reason (for approvals/rejections)

### Export & Reporting
- **CSV Export** - Export filtered logs to CSV
- **All Data Included** - Full audit trail in export
- **Date-stamped Files** - Automatic filename with date

### Statistics Dashboard
- **Total Logs** - Count of all log entries
- **User Actions** - Customer and shop actions count
- **Admin Actions** - Administrative actions count
- **System Events** - Automated events count

### User Interface
- **Responsive Design** - Works on all devices
- **Pagination** - 25, 50, or 100 logs per page
- **Color-coded Badges** - Visual action type indicators
- **Actor Icons** - Visual actor type indicators
- **Detail Modal** - Full log entry details on click
- **Empty States** - Helpful messages when no logs match

## 🎨 Action Types & Colors

### Create Actions
- Badge: Green
- Icon: Plus
- Examples: Product created, Order created, User registered

### Update Actions
- Badge: Blue
- Icon: Edit
- Examples: Profile updated, Order status changed, Settings modified

### Delete Actions
- Badge: Red
- Icon: Trash
- Examples: Product deleted, Account removed

### Login/Logout
- Login: Indigo badge with sign-in icon
- Logout: Gray badge with sign-out icon

### Approve/Reject
- Approve: Green badge with check icon
- Reject: Red badge with times icon

### Refund
- Badge: Yellow
- Icon: Undo
- Examples: Order refunded, Payment reversed

## 🔍 Search & Filter Examples

### Search Examples
```
john@email.com       - Find logs by user email
Product #1234        - Find logs about specific product
approve              - Find all approval actions
192.168.1.1         - Find logs by IP address
```

### Filter Combinations
- **Recent Admin Actions**: Actor Type = Admin, Date = Today
- **User Logins This Week**: Action = Login, Actor Type = User, Date = Last 7 Days
- **Product Moderation**: Action = Approve/Reject, Resource = Product
- **System Events**: Actor Type = System, Date = Last 30 Days

## 📊 Use Cases

### Security & Compliance
- Track unauthorized access attempts
- Audit admin actions for compliance
- Monitor suspicious activities
- Generate audit reports for regulators

### Debugging & Support
- Trace user issues by email
- Find when changes were made
- Identify system errors
- Track order processing

### Analytics
- Most active users
- Most common actions
- Peak activity times
- Admin workload analysis

## 🚀 API Integration

When backend is ready, replace mock data with:

```javascript
const response = await fetch(`${API_BASE_URL}/admin/logs`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    method: 'GET'
});

const data = await response.json();
```

### Expected API Response Format

```json
{
    "logs": [
        {
            "id": 1,
            "timestamp": "2025-10-19T12:00:00Z",
            "actor": {
                "type": "admin",
                "name": "John Admin",
                "email": "john@admin.com",
                "id": 123
            },
            "action": "approve",
            "resource": {
                "type": "Product",
                "id": 456,
                "name": "Product #456"
            },
            "details": "Approved product successfully",
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0...",
            "metadata": {
                "previous_value": null,
                "new_value": "approved",
                "reason": "Meets quality standards"
            }
        }
    ],
    "total": 500,
    "page": 1,
    "per_page": 50
}
```

## 🔧 Technical Details

### Mock Data
- Currently uses `generateMockLogs()` function
- Generates 500 sample logs for testing
- Random actors, actions, and timestamps
- Covers all action types and actor types

### Performance
- Client-side filtering for instant results
- Debounced search (300ms)
- Efficient pagination
- Lazy loading for large datasets

### Security
- JWT authentication required
- Admin role verification
- XSS prevention with escapeHtml()
- No sensitive data exposure

## 📱 Navigation

Access from:
1. Admin Dashboard → Activity Logs widget
2. Direct URL: `/admin/logs/index.html`

## 🎯 Future Enhancements

- Real-time WebSocket updates for new logs
- Advanced analytics dashboard
- Email notifications for critical events
- PDF export option
- Log retention policies
- Automated cleanup of old logs
- Advanced filtering (regex, boolean operators)
- Saved filter presets
- Log comparison view
- Timeline visualization

## 📞 Support

For issues or questions about Activity Logs:
- Check the console for error messages
- Verify JWT token is valid
- Ensure admin role is assigned
- Review network requests in DevTools

---

Built for Fashion AI Platform Admin Panel
Last Updated: October 19, 2025
