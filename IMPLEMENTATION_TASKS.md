# Clinic Link Implementation Tasks

## Instructions for Task Management
- Review completed sections before starting new ones
- Update checkbox status as you progress: [ ] → [x]
- Add notes in parentheses after tasks if issues arise
- Each major section should be tested before moving to the next
- Run `npm run lint` and `npm run typecheck` after each section completion

---

## 1. Database Schema & Models
*Update Prisma schema to match Clinic Link requirements*

### 1.1 Environment Configuration
- [ ] Update `.env` file with Google OAuth credentials
- [ ] Replace Discord auth variables with Google auth variables
- [ ] Set DATABASE_URL for development
- [ ] Update `src/env.js` to use AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET

### 1.2 Prisma Schema Updates
- [ ] Remove the Post model (example code)
- [ ] Add Supervisor role enum to User model
- [ ] Create TimeOffRequest model with proper relationships
- [ ] Create ClinicSession model with all required fields
- [ ] Create SessionCoverage model for audit trail
- [ ] Create Notification model
- [ ] Add indexes for performance optimization
- [ ] Run `npm run db:push` to update database
- [ ] Verify schema with `npm run db:studio`

---

## 2. Authentication System
*Switch from Discord to Google OAuth with whitelist*

### 2.1 NextAuth Configuration
- [ ] Install Google provider package if needed
- [ ] Update `src/server/auth/config.ts` to use GoogleProvider
- [ ] Implement email whitelist for 5 supervisors
- [ ] Add supervisor role assignment in callbacks
- [ ] Update session callback to include role
- [ ] Test Google sign-in flow

### 2.2 Middleware & Protection
- [ ] Create middleware for route protection
- [ ] Implement authorized supervisor check
- [ ] Add redirect logic for unauthorized users
- [ ] Create custom sign-in page with Clinic Link branding
- [ ] Add sign-out functionality

---

## 3. tRPC API Routes
*Create all necessary API endpoints*

### 3.1 Supervisor Router
- [ ] Create `src/server/api/routers/supervisor.ts`
- [ ] Implement `getAll` procedure
- [ ] Implement `getCurrentUser` procedure
- [ ] Implement `updateNotificationPreferences` procedure
- [ ] Add to root router

### 3.2 TimeOffRequest Router
- [ ] Create `src/server/api/routers/timeOffRequest.ts`
- [ ] Implement `create` mutation with nested ClinicSession creation
- [ ] Implement `getAll` query with filtering
- [ ] Implement `getById` query
- [ ] Implement `update` mutation (only if no coverage)
- [ ] Implement `delete` mutation (only if no coverage)
- [ ] Implement `getMyRequests` query
- [ ] Add status calculation based on session coverage

### 3.3 ClinicSession Router
- [ ] Create `src/server/api/routers/clinicSession.ts`
- [ ] Implement `getUncovered` query with date filtering
- [ ] Implement `claim` mutation with conflict handling
- [ ] Implement `release` mutation (admin only)
- [ ] Implement `getByDateRange` query
- [ ] Implement `getUpcoming` query
- [ ] Implement `getClinicNameSuggestions` for autocomplete

### 3.4 Notification Router
- [ ] Create `src/server/api/routers/notification.ts`
- [ ] Implement `getUnread` query
- [ ] Implement `markAsRead` mutation
- [ ] Implement `getAll` query with pagination
- [ ] Implement notification creation helper function
- [ ] Add real-time subscription support (optional)

### 3.5 Dashboard Router
- [ ] Create `src/server/api/routers/dashboard.ts`
- [ ] Implement `getStats` query (coverage metrics)
- [ ] Implement `getUrgentSessions` query
- [ ] Implement `getRecentActivity` query

---

## 4. UI Components
*Build all required interface components*

### 4.1 Layout & Navigation
- [ ] Create app header with logo and user menu
- [ ] Implement responsive sidebar navigation
- [ ] Add notification bell with unread count
- [ ] Create footer with key information
- [ ] Implement dark mode toggle (optional)

### 4.2 Authentication Components
- [ ] Create custom sign-in page with Google button
- [ ] Add loading states for auth
- [ ] Create unauthorized access page
- [ ] Add user profile dropdown

### 4.3 Dashboard Components
- [ ] Create main dashboard layout
- [ ] Build urgent coverage cards (red highlight)
- [ ] Implement coverage statistics widget
- [ ] Create recent activity feed
- [ ] Add quick action buttons

### 4.4 Request Form Components
- [ ] Create multi-step request form
- [ ] Build date range picker with multi-select
- [ ] Create dynamic session entry fields
- [ ] Add clinic name autocomplete
- [ ] Implement time picker with validation
- [ ] Add form review/summary step
- [ ] Create form validation feedback

### 4.5 Session Management Components
- [ ] Create SessionCard component (reusable)
- [ ] Build SessionList with filtering
- [ ] Implement SessionCalendarView
- [ ] Create ClaimButton with optimistic updates
- [ ] Add SessionDetailsModal
- [ ] Build CoverageStatusBadge component

### 4.6 Notification Components
- [ ] Create NotificationDropdown
- [ ] Build NotificationItem component
- [ ] Implement NotificationToast
- [ ] Add NotificationPreferences form

---

## 5. Core Pages
*Implement main application pages*

### 5.1 Dashboard Page (`/dashboard`)
- [ ] Replace current home page content
- [ ] Integrate all dashboard components
- [ ] Add real-time data fetching
- [ ] Implement loading states
- [ ] Add error boundaries

### 5.2 Request Coverage Page (`/request`)
- [ ] Create new route and page
- [ ] Integrate request form
- [ ] Add success confirmation
- [ ] Implement draft saving (optional)

### 5.3 My Requests Page (`/my-requests`)
- [ ] Create page showing user's requests
- [ ] Add status filters
- [ ] Implement request editing (if allowed)
- [ ] Add request cancellation

### 5.4 Coverage Board Page (`/coverage`)
- [ ] Create comprehensive coverage view
- [ ] Add calendar/list toggle
- [ ] Implement advanced filtering
- [ ] Add export functionality (optional)

### 5.5 Admin Panel (`/admin`)
- [ ] Create admin-only route
- [ ] Build user management interface
- [ ] Add coverage override capabilities
- [ ] Implement system statistics

---

## 6. Business Logic Implementation
*Core functionality and rules*

### 6.1 Coverage Request Flow
- [ ] Implement atomic request creation
- [ ] Add validation for date ranges
- [ ] Ensure no duplicate sessions
- [ ] Create notifications on submission
- [ ] Update request status calculation

### 6.2 Coverage Claiming System
- [ ] Implement optimistic UI updates
- [ ] Add database transaction for claims
- [ ] Prevent self-coverage claims
- [ ] Handle concurrent claim attempts
- [ ] Create claim notification
- [ ] Update request status automatically

### 6.3 Notification System
- [ ] Implement notification triggers
- [ ] Add email notification support (optional)
- [ ] Create notification batching
- [ ] Add notification preferences respect

### 6.4 Data Validation
- [ ] Validate all date/time inputs
- [ ] Ensure session times don't overlap
- [ ] Validate clinic names
- [ ] Check supervisor permissions
- [ ] Add request modification rules

---

## 7. Testing & Quality Assurance
*Ensure reliability and performance*

### 7.1 Unit Tests
- [ ] Test date/time utilities
- [ ] Test validation functions
- [ ] Test status calculations
- [ ] Test permission checks

### 7.2 Integration Tests
- [ ] Test tRPC procedures
- [ ] Test database operations
- [ ] Test authentication flow
- [ ] Test notification system

### 7.3 E2E Critical Paths
- [ ] Test complete request → claim flow
- [ ] Test concurrent claiming scenario
- [ ] Test notification delivery
- [ ] Test permission boundaries

### 7.4 Performance Testing
- [ ] Test with large datasets
- [ ] Optimize database queries
- [ ] Add appropriate caching
- [ ] Test real-time updates

---

## 8. Deployment Preparation
*Ready for production on Vercel*

### 8.1 Environment Setup
- [ ] Create production `.env.production`
- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up production database (PostgreSQL)
- [ ] Configure Google OAuth redirect URIs

### 8.2 Database Migration
- [ ] Create production migration strategy
- [ ] Test migrations on staging
- [ ] Prepare seed data for supervisors
- [ ] Set up backup strategy

### 8.3 Build Optimization
- [ ] Run production build locally
- [ ] Fix any build errors
- [ ] Optimize bundle size
- [ ] Configure caching headers
- [ ] Set up error tracking (Sentry optional)

### 8.4 Documentation
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Create user guide
- [ ] Document API endpoints

### 8.5 Pre-Launch Checklist
- [ ] Test auth flow with all 5 supervisors
- [ ] Verify email notifications (if implemented)
- [ ] Check mobile responsiveness
- [ ] Test error states
- [ ] Verify security headers
- [ ] Run accessibility audit
- [ ] Set up monitoring alerts

---

## 9. Post-Launch Tasks
*After successful deployment*

### 9.1 Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Track usage metrics
- [ ] Monitor database performance

### 9.2 Maintenance
- [ ] Schedule regular backups
- [ ] Plan for updates
- [ ] Create incident response plan
- [ ] Document known issues

---

## Progress Summary
- **Total Tasks**: ~150
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 150

## Notes Section
*Add any important notes, blockers, or decisions here*

- Google OAuth Setup: Remember to add authorized redirect URIs for both local and production
- Database: Consider PostgreSQL for production vs SQLite for development
- Notifications: Email integration is optional but recommended for critical coverage alerts
- Testing: Focus on concurrent claiming scenarios as this is the most critical business logic

---

## Review Checklist
After each major section, ensure:
- [ ] Code passes `npm run lint`
- [ ] TypeScript has no errors `npm run typecheck`
- [ ] Database schema is migrated
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Commit created with meaningful message