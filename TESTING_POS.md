# Testing the Cafe POS System

## Step-by-Step Testing Guide

### Step 1: Start the Development Server

```bash
npm run dev
```

Wait for the server to start, then open your browser.

### Step 2: Login as Main Admin

1. Go to: `http://localhost:3000/admin/login`
2. Enter your admin password (from `.env` file: `ADMIN_PASSWORD`)
3. Click "Login"
4. You should be redirected to `/admin`

### Step 3: Create Your First Cafe Staff User

1. From the admin panel, click **"Cafe Staff"** button
2. Or navigate directly to: `http://localhost:3000/admin/cafe-users`
3. You should now see the "Cafe Staff Management" page with the form
4. Fill in:
   - **Name**: `Test Staff` (or any name)
   - **PIN**: `1234` (must be 4-6 digits)
5. Click **"Add User"**
6. You should see a success message and the user appears in the list

### Step 4: Test Cafe Staff Login

1. Open a new incognito/private browser window (or logout from admin)
2. Go to: `http://localhost:3000/cafe/login`
3. You'll see 6 PIN input boxes
4. Enter: `1234`
5. The PIN will auto-submit when all 6 digits are entered (or click "Login")
6. You should be redirected to `/cafe/pos`

### Step 5: Test the POS Interface

1. You should now see the professional POS interface with:
   - Header showing "Sri Murugan POS"
   - Your operator name in the header
   - Order counts (NEW and PREP)
   - Left panel: Order queue (will be empty if no orders)
   - Right panel: "Select an order to view details"

2. To test with real orders:
   - Create a test food order from the public site
   - Or use the admin orders page at `/admin/orders`
   - The order will appear in the POS automatically

3. Click on an order in the left panel to view details
4. Test status changes:
   - Click "Start Preparing" (moves from NEW to PREP)
   - Click "Mark Complete" (moves to DONE and disappears)
   - Or click "Cancel Order" (voids the order)

### Step 6: Test Multiple Staff Users

1. Logout from cafe POS (click "Logout" button)
2. Login as admin again
3. Create another staff user with a different PIN (e.g., `5678`)
4. Test logging in with both PINs

### Step 7: Test Staff Management Features

From `/admin/cafe-users`:

1. **Edit a User**:
   - Click "Edit" on any user
   - Change the name or PIN
   - Click "Update User"

2. **Disable a User**:
   - Click "Disable" on any active user
   - Try logging in with that PIN - should fail with "Account inactive"

3. **Re-enable a User**:
   - Click "Enable" on the disabled user
   - Now you can login again

4. **Delete a User**:
   - Click "Delete" on any user
   - Confirm the deletion
   - User is permanently removed

## Common Issues and Solutions

### Issue: "Unauthorized" error on cafe-users page

**Solution**: Make sure you're logged in as admin first at `/admin/login`

### Issue: PIN login fails with "Invalid PIN"

**Possible causes**:
1. Wrong PIN entered
2. User account is disabled (check status in admin panel)
3. User doesn't exist (verify in admin cafe-users list)

### Issue: Orders not appearing in POS

**Possible causes**:
1. No orders exist - create a test order
2. All orders are completed/cancelled
3. Auto-refresh hasn't fired yet - wait 5 seconds or click "Refresh"

### Issue: Can't create duplicate PIN

**Expected behavior**: Each PIN must be unique. Choose a different PIN.

### Issue: Build errors

**Solution**: 
```bash
npm run build
```
If errors appear, check the console output.

## Environment Variables Checklist

Make sure these are set in your `.env` file:

```env
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=long-random-secret-key
```

Without these, the system won't work properly.

## Performance Testing

### Test Auto-Refresh

1. Open POS interface
2. Create a new order from another browser tab
3. Wait up to 5 seconds
4. Order should appear automatically in POS

### Test Multiple Sessions

1. Open POS in multiple browser tabs
2. Login with the same PIN in each
3. Update an order status in one tab
4. Other tabs should refresh and show the change within 5 seconds

### Test Speed

1. Time how long it takes to:
   - Enter PIN and login (should be < 2 seconds)
   - Change order status (should be instant with button click)
   - Load POS interface (should be < 1 second)

## Production Readiness Checklist

Before going live:

- [ ] Change default admin password to something secure
- [ ] Create real staff accounts with secure PINs
- [ ] Remove test accounts (PIN 1234, etc.)
- [ ] Test on actual POS hardware/tablets
- [ ] Train staff on PIN login and interface
- [ ] Set up sound notifications (browser permission needed)
- [ ] Test internet connection stability
- [ ] Have backup plan if system goes down

## Support

If you encounter issues not covered here, check:
1. Browser console for JavaScript errors
2. Server logs for API errors
3. Database connection (ensure DATABASE_URL is correct)
4. Environment variables are properly set
