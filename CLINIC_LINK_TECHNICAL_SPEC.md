# Clinic Link Technical Specification

## Project Overview

**Application Name**: Clinic Link (internally referenced as WubHub)
**Production Platform**: Vercel
**Primary Purpose**: Transform chaotic email threads between medical supervisors into a structured, relational database powering a clear visual coverage dashboard for clinic sessions.

## Tech Stack

- **Frontend Framework**: Next.js 15.2.3 with React 19
- **Language**: TypeScript 5.8.2
- **Database ORM**: Prisma 6.5.0
- **Database**: SQLite (development), configurable for production
- **API Layer**: tRPC 11.0.0
- **Authentication**: NextAuth 5.0.0-beta.25
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Styling**: Tailwind CSS 4.0.15
- **State Management**: TanStack React Query 5.69.0
- **Date Handling**: date-fns 4.1.0
- **Validation**: Zod 3.24.2

## Core Business Logic

### Problem Statement
Five medical supervisors need to coordinate coverage for clinic sessions when taking time off. Currently handled through unstructured email threads leading to confusion, missed coverage, and double-booking.

### Solution
A centralized web application providing:
1. Structured request submission for time-off coverage needs
2. Real-time visibility of all uncovered sessions
3. One-click coverage claiming system
4. Automated notification system replacing email threads

## Data Architecture

### Primary Entities

#### 1. Supervisor (User)
- **Purpose**: System users (exactly 5 supervisors)
- **Key Fields**:
  - `id`: String (cuid, primary key)
  - `name`: String
  - `email`: String (unique)
  - `role`: Enum (Administrator/User)
- **Relationships**:
  - Has many TimeOffRequests (as requester)
  - Has many SessionCoverages (as coverer)

#### 2. TimeOffRequest
- **Purpose**: Container for a supervisor's absence period
- **Key Fields**:
  - `id`: String (cuid, primary key)
  - `supervisorId`: String (foreign key to User)
  - `startDate`: DateTime
  - `endDate`: DateTime
  - `status`: Enum (Pending/PartialCovered/FullyCovered/Complete)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
- **Relationships**:
  - Belongs to one Supervisor
  - Has many ClinicSessions

#### 3. ClinicSession
- **Purpose**: Granular unit of work requiring coverage
- **Key Fields**:
  - `id`: String (cuid, primary key)
  - `requestId`: String (foreign key to TimeOffRequest)
  - `clinicName`: String (dynamic, user-entered)
  - `date`: DateTime
  - `startTime`: DateTime
  - `endTime`: DateTime
  - `notes`: String (optional, e.g., "3 trainees, separate cases")
  - `coveredBySupervisorId`: String (nullable, foreign key to User)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
- **Relationships**:
  - Belongs to one TimeOffRequest
  - May have one covering Supervisor

#### 4. SessionCoverage (Audit/History)
- **Purpose**: Track coverage claims and changes
- **Key Fields**:
  - `id`: String (cuid, primary key)
  - `sessionId`: String (foreign key to ClinicSession)
  - `supervisorId`: String (foreign key to User)
  - `action`: Enum (Claimed/Released)
  - `timestamp`: DateTime

## Feature Specifications

### 1. Authentication System
- **Implementation**: NextAuth with Prisma Adapter
- **Provider**: Google OAuth only
- **Requirements**:
  - Google Sign-In for 5 pre-authorized supervisors
  - Whitelist of allowed Google email addresses
  - Session persistence
  - No self-registration (only pre-authorized Google accounts can access)
- **Security**: All routes protected except login page

### 2. Coverage Request Submission

#### User Flow:
1. Supervisor selects absence dates (single/range/multiple non-consecutive)
2. For each date, dynamic form allows entry of multiple sessions
3. Each session requires:
   - Clinic name (free text input with suggestions from previous entries)
   - Start and end times
   - Optional notes
4. Submit creates one TimeOffRequest with associated ClinicSessions

#### Technical Implementation:
- React Hook Form for complex form management
- Zod schemas for validation
- tRPC mutation for atomic database operations
- React Day Picker for date selection

### 3. Coverage Dashboard

#### Primary View Components:
1. **Urgent Coverage Needed** (red highlight):
   - Uncovered sessions within next 7 days
   - Sorted by date/time
   - Shows: clinic name, date, time, requesting supervisor

2. **All Sessions View**:
   - Calendar or list view toggle
   - Filter options: date range, supervisor, coverage status
   - Color coding: red (uncovered), yellow (partial), green (covered)

#### Technical Implementation:
- Real-time updates via tRPC subscriptions or polling
- Virtualized list for performance with large datasets
- Client-side filtering and sorting

### 4. Coverage Claiming System

#### Business Rules:
- Only uncovered sessions can be claimed
- Once claimed, session locked to prevent double-booking
- Claiming supervisor cannot be the requesting supervisor
- Claims are immediate and final (no unclaim without admin)

#### Technical Implementation:
- Optimistic updates for instant UI feedback
- Database transaction to ensure atomicity
- Conflict resolution for simultaneous claims

### 5. Notification System

#### Notification Triggers:
1. New coverage request submitted → All other supervisors
2. Session claimed → Requesting supervisor
3. All sessions covered → Requesting supervisor
4. Upcoming uncovered session (24hr warning) → All supervisors

#### Technical Implementation:
- In-app notifications with unread count
- Optional email notifications (configurable per user)
- Notification preferences stored in user profile

## API Structure (tRPC Routes)

### Auth Routes
- `auth.getSession`: Current user session
- `auth.logout`: End session

### Supervisor Routes
- `supervisor.getAll`: List all supervisors
- `supervisor.getProfile`: Get current user profile
- `supervisor.updateNotificationPrefs`: Update notification settings

### TimeOffRequest Routes
- `timeOffRequest.create`: Create new request with sessions
- `timeOffRequest.getAll`: List all requests (with filtering)
- `timeOffRequest.getById`: Single request details
- `timeOffRequest.update`: Update request (before coverage claimed)
- `timeOffRequest.delete`: Delete request (if no coverage claimed)

### ClinicSession Routes
- `clinicSession.getUncovered`: List all uncovered sessions
- `clinicSession.claim`: Claim a session for coverage
- `clinicSession.getByDateRange`: Sessions within date range
- `clinicSession.getSuggestions`: Autocomplete for clinic names

### Notification Routes
- `notification.getUnread`: Current user's unread notifications
- `notification.markAsRead`: Mark notification(s) as read
- `notification.getHistory`: Notification history

## UI/UX Requirements

### Design Principles
1. **Clarity**: Clear visual hierarchy, prominent CTAs
2. **Speed**: Instant feedback, optimistic updates
3. **Mobile-First**: Responsive design for on-the-go coverage claims
4. **Accessibility**: WCAG 2.1 AA compliance

### Key UI Components
- Session card component (reusable for lists/grids)
- Coverage status badge
- Date/time picker with validation
- Dynamic form array for multiple sessions
- Toast notifications for actions
- Modal dialogs for confirmations

## Security Considerations

### Data Protection
- Session-based authentication
- API routes protected by authentication middleware
- Input validation at both client and server
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React's default escaping

### Business Logic Security
- Prevent self-coverage claiming
- Atomic transactions for coverage claims
- Audit logging for all coverage actions
- Rate limiting on API routes

## Deployment Configuration

### Environment Variables Required
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

### Vercel Deployment Settings
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Development Command: `npm run dev`

### Database Migration Strategy
1. Development: SQLite for rapid prototyping
2. Production: PostgreSQL on Vercel Postgres or Supabase
3. Migration command: `npm run db:migrate`

## Performance Optimization

### Strategies
1. Static generation for public pages
2. ISR for semi-static content
3. Edge functions for API routes where applicable
4. Image optimization via Next.js Image component
5. Code splitting and lazy loading
6. Database indexing on frequently queried fields

## Monitoring and Analytics

### Key Metrics
- Coverage claim response time
- Percentage of sessions covered within 24 hours
- User engagement metrics
- API response times
- Error rates and types

## Future Considerations

### Potential Enhancements (Not in Initial Scope)
1. Recurring coverage patterns
2. Coverage trading between supervisors
3. Historical analytics and reporting
4. Integration with calendar systems
5. Mobile native app

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run db:studio    # Open Prisma Studio
npm run lint         # Run linting
npm run typecheck    # TypeScript checking

# Database
npm run db:push      # Push schema changes
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations

# Production
npm run build        # Production build
npm run start        # Start production server
```

## Testing Strategy

### Test Coverage Requirements
- Unit tests for business logic functions
- Integration tests for tRPC routes
- E2E tests for critical user flows (request → claim → notification)
- Component tests for complex UI elements

### Critical Test Cases
1. Simultaneous coverage claims
2. Date/time validation edge cases
3. Notification delivery
4. Session status transitions
5. Authorization boundaries

## Notes for LLM Context

This application is specifically designed for a medical supervision context where coverage coordination is critical. The system prioritizes:
1. Data integrity over feature complexity
2. Real-time accuracy over historical analytics
3. Simplicity in user flow over extensive customization
4. Reliability and uptime as coverage gaps have real consequences

The application does NOT require HIPAA compliance as it does not store patient data - only supervisor scheduling information. The primary goal is replacing inefficient email communication with structured, reliable coverage coordination.