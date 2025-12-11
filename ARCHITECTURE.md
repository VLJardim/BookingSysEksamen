# System Architecture - BookingSysEksamen

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Student    │  │   Teacher    │  │   Profile    │      │
│  │   Dashboard  │  │   Dashboard  │  │   Pages      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │          React Components (Mantine UI)         │         │
│  │  - BookingCard  - BookingForm  - Modals        │         │
│  └────────────────────────────────────────────────┘         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    NEXT.JS APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │              App Router (Pages)                │         │
│  │  /login  /register  /student-home              │         │
│  │  /teacher-home  /my-bookings  /profile         │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │              API Routes                        │         │
│  │  /api/bookings  /api/bookings/[id]             │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │         Server Components & Utilities          │         │
│  │  - Auth Helpers  - Validation (Zod)            │         │
│  │  - Error Handling  - Date Formatting           │         │
│  └────────────────────────────────────────────────┘         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Supabase Client SDK
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    SUPABASE BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │         Authentication Service                 │         │
│  │  - User Registration  - Login/Logout           │         │
│  │  - Session Management  - JWT Tokens            │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │         PostgreSQL Database                    │         │
│  │                                                │         │
│  │  ┌──────────────┐  ┌──────────────┐           │         │
│  │  │   booking    │  │   facility   │           │         │
│  │  │   table      │  │   table      │           │         │
│  │  │              │  │              │           │         │
│  │  │ - booking_id │  │ - id         │           │         │
│  │  │ - title      │  │ - title      │           │         │
│  │  │ - role       │  │ - capacity   │           │         │
│  │  │ - starts_at  │  │              │           │         │
│  │  │ - ends_at    │  │              │           │         │
│  │  │ - owner      │  │              │           │         │
│  │  │ - facility_id│──┼──foreign key │           │         │
│  │  └──────────────┘  └──────────────┘           │         │
│  │                                                │         │
│  │  ┌──────────────┐                             │         │
│  │  │   auth.users │                             │         │
│  │  │   table      │                             │         │
│  │  │              │                             │         │
│  │  │ - id (UUID)  │                             │         │
│  │  │ - email      │                             │         │
│  │  │ - role       │                             │         │
│  │  └──────────────┘                             │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │    Row Level Security (RLS) Policies           │         │
│  │  - Users can only see their own bookings       │         │
│  │  - Students can book available slots           │         │
│  │  - Teachers can create availability            │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Student Booking Flow

```
┌─────────┐      ┌──────────────┐      ┌──────────┐      ┌──────────┐
│ Student │─────▶│ Browse Slots │─────▶│ Select   │─────▶│ Confirm  │
│  Logs   │      │  (Teacher-   │      │ Time     │      │ Booking  │
│   In    │      │   Created)   │      │ Slot     │      │          │
└─────────┘      └──────────────┘      └──────────┘      └──────────┘
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │ Update   │
                                                         │ Booking  │
                                                         │ Role to  │
                                                         │not_avail │
                                                         └──────────┘
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │ Show in  │
                                                         │   My     │
                                                         │ Bookings │
                                                         └──────────┘
```

### Teacher Slot Creation Flow

```
┌─────────┐      ┌──────────────┐      ┌──────────┐      ┌──────────┐
│ Teacher │─────▶│ Create New   │─────▶│ Set Time │─────▶│ Create   │
│  Logs   │      │ Availability │      │ & Room   │      │ Booking  │
│   In    │      │    Slot      │      │          │      │          │
└─────────┘      └──────────────┘      └──────────┘      └──────────┘
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │ Insert   │
                                                         │ with     │
                                                         │ role =   │
                                                         │available │
                                                         └──────────┘
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │ Visible  │
                                                         │   to     │
                                                         │ Students │
                                                         └──────────┘
```

### Cancel Booking Flow

```
┌─────────┐      ┌──────────────┐      ┌──────────┐      ┌──────────┐
│  User   │─────▶│ View My      │─────▶│ Click    │─────▶│ Confirm  │
│         │      │ Bookings     │      │ Cancel   │      │ Modal    │
└─────────┘      └──────────────┘      └──────────┘      └──────────┘
                                                                │
                                                                ▼
                                                         ┌──────────┐
                                                         │ Delete   │
                                                         │ Booking  │
                                                         │   OR     │
                                                         │ Update   │
                                                         │  Role    │
                                                         └──────────┘
```

## Component Hierarchy

```
App Layout (layout.tsx)
├── MantineProviderWrapper
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── User Menu
│   │
│   └── ConditionalLayout
│       └── Page Content
│           │
│           ├── Student Home
│           │   ├── BookingForm
│           │   └── Upcoming Bookings Sidebar
│           │       └── BookingCard (×3)
│           │
│           ├── Teacher Home
│           │   ├── Availability Form
│           │   └── Slots Overview
│           │
│           ├── My Bookings
│           │   ├── BookingCard (×N)
│           │   └── ConfirmationModal
│           │
│           ├── Login
│           │   └── Login Form
│           │
│           └── Register
│               └── Registration Form
```

## Technology Integration Map

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  React 19  ◄──────┐                                      │
│     │             │                                      │
│     │             └── Next.js 16 (App Router)           │
│     │                      │                            │
│     ▼                      ▼                            │
│  Mantine UI          TypeScript                         │
│  Components          Type Safety                        │
│     │                      │                            │
│     └──────────────────────┘                            │
│              │                                           │
│              ▼                                           │
│        Tailwind CSS                                      │
│        (Styling)                                         │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Zod (Validation) ◄── Schemas ──► API Routes            │
│                                         │                │
│  Day.js (Dates)   ◄── Utils ────────────┘                │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Supabase Client ◄──► Auth Service                      │
│       │                    │                            │
│       │                    └── JWT Tokens               │
│       │                                                 │
│       └──► PostgreSQL Database                          │
│                 │                                       │
│                 └── Row Level Security (RLS)            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌──────────────┐
│   User       │
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Next.js    │
│  Middleware  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Check Session    │
│ (Supabase Auth)  │
└──────┬───────────┘
       │
       ▼
    Valid?
     /  \
   No    Yes
   /      \
  ▼        ▼
┌────┐  ┌──────────────┐
│403 │  │ Check RLS    │
│or  │  │ Policies     │
│302 │  └──────┬───────┘
└────┘         │
               ▼
          Authorized?
             /  \
           No    Yes
           /      \
          ▼        ▼
       ┌────┐  ┌──────────┐
       │403 │  │ Execute  │
       └────┘  │ Query    │
               └──────────┘
```

## Booking State Machine

```
┌─────────────────┐
│   AVAILABLE     │ ◄─── Created by Teacher
│  (role=avail)   │
└────────┬────────┘
         │
         │ Student books it
         │
         ▼
┌─────────────────┐
│ NOT_AVAILABLE   │ ◄─── Owned by Student
│(role=not_avail) │
└────────┬────────┘
         │
         │ Student cancels
         │
         ▼
┌─────────────────┐
│    DELETED      │ ◄─── Removed from DB
│                 │      OR returned to
└─────────────────┘      available pool
```

---

**See also:**
- [CAPABILITIES.md](./CAPABILITIES.md) - Full feature documentation
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick start guide
- [README.md](./README.md) - Project overview
