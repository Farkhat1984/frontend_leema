# 📊 Advanced Analytics - Documentation

## Overview
The Advanced Analytics page provides comprehensive business insights for shop owners with interactive charts, key metrics, and data export capabilities.

## Features

### 1. Key Metrics Dashboard
- **Total Revenue**: Total earnings from completed orders
- **Total Orders**: Number of orders received
- **Average Order Value (AOV)**: Average revenue per order
- **Total Customers**: Unique customers count
- **Trend Indicators**: Visual indicators showing performance changes

### 2. Period Selection
- **Predefined Periods**:
  - 7 days
  - 30 days
  - 90 days
  - 365 days (1 year)
- **Custom Date Range**: Select specific start and end dates

### 3. Revenue Chart
Interactive line chart showing revenue trends over time with three view modes:
- **Daily**: Day-by-day revenue breakdown
- **Weekly**: Weekly aggregated revenue
- **Monthly**: Monthly revenue totals

**Chart Features**:
- Smooth curved lines
- Gradient fill under the line
- Interactive hover tooltips
- Responsive design

### 4. Orders Chart
Bar chart displaying order volume over time:
- Daily order counts
- Visual representation of sales activity
- Easy identification of peak periods

### 5. Comparison Section
**Period Comparison**:
- Current period vs. previous period revenue
- Percentage change calculation
- Side-by-side revenue comparison

**Conversion Metrics**:
- Product views to sales conversion rate
- Total product views
- Total product sales

### 6. Detailed Metrics

#### Customer Metrics
- **New Customers**: First-time buyers
- **Returning Customers**: Repeat purchasers
- **LTV (Lifetime Value)**: Average customer lifetime value
- **Retention Rate**: Percentage of returning customers

#### Product Metrics
- **Active Products**: Approved and available products
- **Pending Products**: Products awaiting approval
- **Total Views**: Combined product view count
- **Total Try-Ons**: AR try-on usage count

#### Order Status Breakdown
- Completed orders
- Pending orders
- Cancelled orders
- Refunded orders

### 7. Top Products Table
Displays top 10 performing products by revenue:
- Product name
- Units sold
- Total revenue
- Average selling price

### 8. Category Performance
Doughnut chart showing revenue distribution across product categories:
- Visual percentage breakdown
- Color-coded categories
- Interactive tooltips with exact amounts

### 9. Automated Insights
AI-driven insights that highlight:
- ✅ Strong revenue growth (>10% increase)
- ✅ High customer retention (>50%)
- ✅ Good conversion rates (>5%)
- ✅ High average order value (>$100)

### 10. Data Export

#### CSV Export
Exports order data and summary metrics:
- Order ID, Date, Customer, Amount, Status
- Summary statistics at the bottom
- Compatible with Excel and Google Sheets

#### JSON Export
Complete analytics data export including:
- All metrics
- Orders array
- Products array
- Customers array
- Period information

## Technical Implementation

### Frontend Stack
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients and animations
- **JavaScript (ES6+)**: Async/await, modules
- **Chart.js 4.4.0**: Interactive charts

### API Integration
```javascript
// Endpoints used
GET /api/v1/shops/me              // Shop info
GET /api/v1/shops/me/orders       // Orders data
GET /api/v1/shops/me/products     // Products data
```

### Data Processing
- Client-side data aggregation
- Date range filtering
- Metric calculations
- Chart data preparation

### Performance
- Lazy loading of Chart.js
- Efficient data filtering
- Minimal API calls
- Local data caching

## Usage Guide

### Accessing Analytics
1. Navigate to Shop Dashboard
2. Click "📊 Продвинутая аналитика" button
3. Or directly: `/shop/analytics/index.html`

### Changing Time Period
1. Click one of the period buttons (7/30/90/365 days)
2. OR select custom dates using date pickers
3. Data refreshes automatically

### Viewing Different Chart Types
- **Revenue Chart**: Click Daily/Weekly/Monthly buttons
- **Orders Chart**: Automatically displays daily data
- **Category Chart**: Shows distribution automatically

### Exporting Data
1. Scroll to "Export Data" section
2. Click "Export to CSV" for spreadsheet format
3. Click "Export to JSON" for raw data format

## Chart Interaction

### Hover Actions
- Hover over any chart point to see detailed tooltip
- Revenue chart shows exact dollar amount
- Orders chart shows order count
- Category chart shows amount and percentage

### Responsive Design
- Charts adapt to screen size
- Mobile-friendly layout
- Touch-enabled on mobile devices

## Calculations

### Revenue
```javascript
totalRevenue = completedOrders.reduce((sum, order) => 
  sum + order.total_amount, 0
)
```

### Average Order Value
```javascript
averageOrder = totalRevenue / totalOrders
```

### Customer LTV
```javascript
customerLTV = totalRevenue / totalCustomers
```

### Retention Rate
```javascript
retentionRate = (returningCustomers / totalCustomers) * 100
```

### Conversion Rate
```javascript
conversionRate = (productSales / productViews) * 100
```

## Color Scheme

### Key Metrics
- Primary: `#667eea` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Danger: `#ef4444` (Red)
- Info: `#3b82f6` (Blue)

### Trend Indicators
- Up Trend: Green background, dark green text
- Down Trend: Red background, dark red text
- Neutral: Gray background, gray text

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure
```
/shop/analytics/
  └── index.html                 # Main analytics page

/assets/js/pages/shop/
  └── analytics.js               # Analytics logic

/assets/css/
  ├── layouts/style.css          # Base styles
  └── pages/shop.css             # Shop-specific styles
```

## Future Enhancements
- [ ] Real-time data updates via WebSocket
- [ ] Predictive analytics using ML
- [ ] Custom metric creation
- [ ] Scheduled report generation
- [ ] Email report delivery
- [ ] PDF export option
- [ ] Comparison with industry benchmarks
- [ ] Cohort analysis
- [ ] Funnel visualization
- [ ] A/B testing insights

## Troubleshooting

### Charts Not Loading
- Check Chart.js CDN connection
- Verify browser console for errors
- Ensure proper authentication token

### No Data Displayed
- Verify date range has orders
- Check API endpoint responses
- Confirm shop has completed orders

### Export Not Working
- Check browser download permissions
- Verify data is loaded before exporting
- Try different export format

## Support
For issues or questions:
- Check browser console logs
- Review API response codes
- Contact development team

---

**Version**: 1.0.0  
**Last Updated**: October 19, 2025  
**Status**: Production Ready ✅
