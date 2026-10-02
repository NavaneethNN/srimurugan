# Cafe POS System Guide

## Overview

A professional VISTA-style Point of Sale (POS) system for cafeteria management at Sri Murugan Cinema. The system features separate access levels for main admin and cafe staff with PIN-based authentication for fast, secure access.

## System Architecture

### Two-Level Access System

1. **Main Admin** (`/admin`)
   - Full system access
   - Manages movies, cafe menu, and cafe staff
   - Creates cafe staff accounts with PINs
   - Password-based authentication

2. **Cafe Staff** (`/cafe/pos`)
   - Order management only
   - PIN-based quick login (4-6 digits)
   - Real-time order updates
   - Professional POS interface

## URLs

- **Main Admin Login**: `/admin/login`
- **Main Admin Panel**: `/admin`
- **Cafe Staff Management**: `/admin/cafe-users`
- **Cafe Menu Management**: `/admin/cafe`
- **Cafe Staff Login**: `/cafe/login`
- **Cafe POS Interface**: `/cafe/pos`
- **Food Orders (Admin View)**: `/admin/orders`

## Getting Started

### 1. Main Admin Setup

1. Login to admin panel at `/admin/login`
2. Navigate to **Cafe Staff** from the main admin panel
3. Create cafe staff accounts with:
   - Name (staff member name)
   - PIN (4-6 digits, unique for each staff member)

### 2. Cafe Staff Login

1. Staff visits `/cafe/login`
2. Enters their assigned PIN (4-6 digits)
3. System validates and redirects to POS interface

### 3. Using the POS Interface

The POS interface features:

#### Left Panel - Order Queue
- Shows all active orders (pending + preparing)
- Real-time updates every 5 seconds
- Color-coded status indicators:
  - **AMBER**: NEW orders (pending)
  - **BLUE**: Orders being prepared (preparing)
- Click any order to view details

#### Right Panel - Order Details
- Full order information
- Item list with quantities
- Total amount
- Quick action buttons:
  - **Start Preparing**: Move order from pending to preparing
  - **Mark Complete**: Finish order (moves to completed)
  - **Cancel Order**: Cancel/void order
  - **Clear**: Deselect current order

#### Header
- Shows count of NEW and PREP orders
- Displays operator name
- Logout button

## Features

### Speed Optimized

- **Auto-refresh**: Orders refresh every 5 seconds automatically
- **Keyboard-friendly**: PIN entry optimized for numeric keypads
- **One-click actions**: Change order status with single button press
- **No navigation required**: All operations on single screen

### Professional Design

- Clean, high-contrast interface
- Large, readable fonts
- Clear status indicators
- VISTA-style layout with side-by-side panels
- Minimal UI elements for speed

### Security

- PIN-based authentication for staff
- Separate sessions for admin and cafe staff
- Session timeout after 12 hours
- Active/inactive user management

## Admin Features

### Cafe Staff Management (`/admin/cafe-users`)

- **Create Users**: Add new cafe staff with name and PIN
- **Edit Users**: Update name or change PIN
- **Toggle Status**: Enable/disable user access without deletion
- **View Activity**: See last login time for each user
- **Delete Users**: Permanently remove user accounts

### PIN Requirements

- Must be 4-6 digits
- Must be unique (no duplicate PINs)
- Numeric only
- Easy to remember for staff

## Order Status Flow

```
NEW (pending)
    ↓
PREP (preparing)
    ↓
DONE (completed)
```

Or:

```
NEW/PREP
    ↓
VOID (cancelled)
```

## Best Practices

### For Main Admin

1. Create unique PINs for each staff member
2. Use memorable but secure PINs (avoid 1234, 0000, etc.)
3. Regularly review staff login activity
4. Disable inactive staff accounts rather than deleting them
5. Train staff on PIN security (don't share)

### For Cafe Staff

1. Memorize your PIN - don't write it down
2. Logout when leaving the POS station
3. Check order details before marking complete
4. Use "Start Preparing" to acknowledge new orders
5. Keep the POS screen visible for new order notifications

## Technical Details

### Database Schema

```sql
CREATE TABLE cafe_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  pin VARCHAR(6) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

- `POST /api/cafe/auth` - Staff login with PIN
- `DELETE /api/cafe/auth` - Staff logout
- `GET /api/cafe/session` - Check current session
- `GET /api/admin/cafe-users` - List all cafe users (admin)
- `POST /api/admin/cafe-users` - Create cafe user (admin)
- `PATCH /api/admin/cafe-users/[id]` - Update cafe user (admin)
- `DELETE /api/admin/cafe-users/[id]` - Delete cafe user (admin)

### Session Management

- **Admin Session**: Cookie-based, uses `admin-session` cookie
- **Cafe Session**: Cookie-based, uses `cafe-session` cookie
- **Session Duration**: 12 hours
- **Auto-logout**: Session expires after timeout

## Troubleshooting

### Staff Can't Login

1. Check if PIN is correct (4-6 digits)
2. Verify user account is active in `/admin/cafe-users`
3. Check if PIN was recently changed
4. Ensure browser cookies are enabled

### Orders Not Appearing

1. Check if auto-refresh is working (5-second interval)
2. Manually refresh using the "Refresh" button
3. Check internet connection
4. Verify order payment status (only paid orders show in POS)

### PIN Already Exists Error

- Each PIN must be unique across all cafe users
- Choose a different PIN or edit/delete the existing user with that PIN

## Migration from Old System

If migrating from an existing order management system:

1. Run database migration: `npm run db:push`
2. Create initial cafe staff accounts
3. Train staff on new PIN-based login
4. Test with a few orders before going live
5. Keep old system running in parallel for 1-2 days as backup

## Support

For technical issues or feature requests, contact the development team or refer to the main project documentation.
