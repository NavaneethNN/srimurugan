# 🚀 Launch Checklist - VISTA POS System

## Pre-Launch Setup (30 minutes)

### 1. Database Setup ✅
- [x] Run migration: `npm run db:push`
- [x] Verify cafe_users table exists
- [x] Test database connection

### 2. Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `ADMIN_PASSWORD` - Strong admin password
- [ ] `SESSION_SECRET` - Long random string (32+ chars)
- [ ] `RAZORPAY_TEST_API_KEY` - For payments
- [ ] `RAZORPAY_TEST_API_SECRET` - For payments
- [ ] `RAZORPAY_WEBHOOK_SECRET` - For webhooks

### 3. Initial Admin Account
- [ ] Login at `/admin/login` with your password
- [ ] Verify dashboard loads correctly
- [ ] Check all modules are accessible

### 4. Create First Cafe Staff User
- [ ] Go to `/admin/cafe-users`
- [ ] Create test user:
  - Name: "Test Staff"
  - PIN: "1234"
- [ ] Verify user appears in list

### 5. Test Cafe POS
- [ ] Open `/cafe/login` in new browser/incognito
- [ ] Enter PIN: 1234
- [ ] Verify POS interface loads
- [ ] Check auto-refresh is working

---

## System Testing (20 minutes)

### Admin Dashboard
- [ ] Stats show real numbers (not all zeros)
- [ ] Module cards are clickable
- [ ] Hover effects work
- [ ] Quick actions work
- [ ] Auto-refresh updates stats (wait 10 seconds)

### Movies Management
- [ ] Can add new movie
- [ ] Can edit existing movie
- [ ] Can add/remove showtimes
- [ ] Can delete movie
- [ ] Tab switching works (Now/Upcoming)
- [ ] Back to dashboard works

### Food Orders
- [ ] Orders display correctly
- [ ] Status filters work
- [ ] Can update order status
- [ ] Real-time updates work (10 second refresh)

### Cafe Menu
- [ ] Can add categories
- [ ] Can add products
- [ ] Can add variants
- [ ] Can edit/delete items
- [ ] Form validation works

### Cafe Staff
- [ ] Can create new staff user
- [ ] Can edit user (name/PIN)
- [ ] Can toggle active/inactive
- [ ] Can delete user
- [ ] Last login time updates

### Cafe POS
- [ ] Orders appear in queue
- [ ] Can select order
- [ ] Order details show correctly
- [ ] Can click "Start Preparing"
- [ ] Can click "Mark Complete"
- [ ] No cancel button visible
- [ ] Auto-refresh works (2 seconds)

### Real-Time Notifications
- [ ] Create new order (via `/order-food` or admin)
- [ ] Popup appears within 3 seconds on POS
- [ ] Sound plays (if browser allows)
- [ ] Popup shows correct order details
- [ ] "Accept & Start" button works
- [ ] Order moves to PREP status
- [ ] Order appears in right panel

---

## Performance Testing (10 minutes)

### Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Module pages load in < 1 second
- [ ] Navigation between pages < 500ms
- [ ] POS loads in < 2 seconds

### Real-Time Features
- [ ] New order detected within 3 seconds
- [ ] Popup appears instantly after detection
- [ ] Stats refresh every 10 seconds (dashboard)
- [ ] Orders refresh every 2 seconds (POS)

### Network Conditions
- [ ] Works on normal connection
- [ ] Test on slow connection (3G)
- [ ] Handles brief disconnections
- [ ] Reconnects automatically

---

## Security Testing (10 minutes)

### Authentication
- [ ] Can't access `/admin/dashboard` without login
- [ ] Can't access `/cafe/pos` without PIN
- [ ] Sessions expire after 12 hours
- [ ] Logout works for both roles

### Authorization
- [ ] Cafe staff can't access admin pages
- [ ] Admin can't use cafe POS (separate session)
- [ ] API routes check authentication
- [ ] Invalid sessions redirect to login

### Data Validation
- [ ] PIN must be 4-6 digits
- [ ] PIN must be unique
- [ ] Form validation prevents invalid data
- [ ] SQL injection attempts fail

---

## Hardware Testing (if available)

### Tablets/POS Hardware
- [ ] POS loads correctly on tablet
- [ ] Touch targets are large enough (44px+)
- [ ] Text is readable from arm's length
- [ ] Buttons respond to touch
- [ ] No accidental clicks

### Different Browsers
- [ ] Chrome (primary)
- [ ] Safari (iOS/Mac)
- [ ] Firefox
- [ ] Edge

### Different Devices
- [ ] Desktop (admin)
- [ ] Tablet (cafe POS)
- [ ] Mobile (backup access)

---

## User Training (30 minutes)

### Admin Training
- [ ] Show dashboard overview
- [ ] Explain module navigation
- [ ] Demonstrate adding movie
- [ ] Show order monitoring
- [ ] Explain staff management
- [ ] Practice workflow

### Cafe Staff Training
- [ ] Show PIN login process
- [ ] Explain POS interface layout
- [ ] Demonstrate accepting order (popup)
- [ ] Show order progression (NEW → PREP → DONE)
- [ ] Explain what "Clear" button does
- [ ] Practice complete workflow
- [ ] Emergency: manual refresh if needed

---

## Documentation Review

### Ensure Staff Have Access To:
- [ ] QUICK_START_POS.md (printed/bookmarked)
- [ ] Their PIN number (secure location)
- [ ] Admin phone number for issues
- [ ] Emergency procedures

### Admin Should Review:
- [ ] CAFE_POS_GUIDE.md (full system)
- [ ] ADMIN_TESTING.md (admin features)
- [ ] REALTIME_TESTING.md (troubleshooting)
- [ ] BEFORE_AFTER.md (what changed)

---

## Production Deployment

### Build
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No build warnings

### Environment
- [ ] Production DATABASE_URL set
- [ ] Strong ADMIN_PASSWORD set
- [ ] Unique SESSION_SECRET generated
- [ ] Production Razorpay keys set
- [ ] NODE_ENV=production

### SSL/Security
- [ ] HTTPS enabled
- [ ] Secure cookies enabled (production)
- [ ] Session cookies httpOnly
- [ ] CORS configured correctly

### Monitoring
- [ ] Error logging enabled
- [ ] Performance monitoring setup
- [ ] Database backups scheduled
- [ ] Uptime monitoring active

---

## Go-Live (Launch Day)

### Pre-Opening
- [ ] Start server
- [ ] Verify dashboard loads
- [ ] Login all cafe staff to POS
- [ ] Test with 1-2 practice orders
- [ ] Confirm notifications working

### During Service
- [ ] Monitor first 10 orders closely
- [ ] Watch for any errors
- [ ] Check order response times
- [ ] Verify staff comfortable with interface

### End of Day
- [ ] Review order logs
- [ ] Check for any missed orders
- [ ] Gather staff feedback
- [ ] Document any issues

---

## Post-Launch (First Week)

### Daily Checks
- [ ] Morning: Verify system is up
- [ ] Noon: Check pending order count
- [ ] Evening: Review day's orders
- [ ] Night: Check for errors in logs

### Performance Monitoring
- [ ] Track average order response time
- [ ] Monitor page load times
- [ ] Check database performance
- [ ] Verify auto-refresh working

### User Feedback
- [ ] Ask staff for issues
- [ ] Note any confusion points
- [ ] Track repeated problems
- [ ] Document feature requests

---

## Troubleshooting Quick Reference

### "Popup doesn't appear"
1. Check browser console for errors
2. Verify order status is "pending"
3. Wait up to 3 seconds for polling
4. Try manual refresh

### "Can't login with PIN"
1. Verify user is active
2. Check PIN is correct
3. Try different browser
4. Contact admin to reset

### "Stats show zeros"
1. Wait 10 seconds for refresh
2. Verify data exists in database
3. Check browser console
4. Hard refresh page

### "Orders not updating"
1. Check internet connection
2. Verify server is running
3. Check polling isn't blocked
4. Try manual refresh

---

## Emergency Procedures

### System Down
1. Check server status
2. Verify database connection
3. Check domain/hosting
4. Contact technical support
5. Use backup order system (paper)

### Staff Can't Login
1. Reset PIN in admin panel
2. Create new temporary account
3. Document issue for later review

### Orders Not Processing
1. Check Razorpay status
2. Verify webhook endpoint
3. Manually check database
4. Process orders manually if needed

---

## Success Criteria

System is ready for production when:

- [x] All tests pass
- [x] Performance meets targets
- [x] Security verified
- [x] Staff trained
- [x] Documentation complete
- [x] Monitoring active
- [x] Backup plan ready
- [x] Emergency contacts available

---

## Contact Information

### Technical Support
- Developer: [Your contact]
- Database: [DB admin contact]
- Hosting: [Hosting support]

### Business Contacts
- Cinema Manager: [Manager contact]
- IT Lead: [IT contact]
- Payment Issues: [Finance contact]

---

## Sign-Off

### Completed By:
- [ ] Technical Setup: _________________ Date: _______
- [ ] Testing Complete: ________________ Date: _______
- [ ] Training Done: ___________________ Date: _______
- [ ] Ready for Launch: ________________ Date: _______

### Approved By:
- [ ] Cinema Manager: __________________ Date: _______
- [ ] IT Lead: _________________________ Date: _______

---

## 🎉 Launch!

Once all checkboxes are complete, you're ready to go live!

**Remember**: 
- First day: Monitor closely
- First week: Gather feedback
- First month: Optimize based on real usage

**Good luck with your launch!** 🚀
