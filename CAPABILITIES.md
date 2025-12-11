# BookingSysEksamen - System Capabilities

## What is this system?

This is a **Booking System** (BookingSysEksamen) designed for educational institutions to manage room/facility bookings. It's built with modern web technologies and provides different interfaces for students and teachers.

## 🎯 Core Purpose

The system allows:
- **Students** to book available time slots in facilities/rooms
- **Teachers** to create available time slots for students to book
- **Both** to manage and view their bookings

## 🛠 Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 19** - Latest React features
- **Mantine UI** - Component library with forms, notifications, and hooks
- **Tailwind CSS** - Utility-first styling
- **Day.js** - Date/time manipulation

### Backend & Database
- **Supabase** - Backend as a Service (Authentication + PostgreSQL)
- **Supabase Auth** - User authentication and session management
- **PostgreSQL** - Relational database via Supabase
- **Next.js API Routes** - Server-side API endpoints

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript Compiler** - Type checking

## 📁 Project Structure

```
booking-sys/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── bookings/     # Booking API endpoints
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── student-home/     # Student dashboard
│   ├── teacher-home/     # Teacher dashboard
│   ├── my-bookings/      # User's bookings page
│   └── profile/          # User profile
├── src/
│   ├── components/       # Reusable React components
│   ├── forms/           # Form components (booking forms)
│   ├── lib/             # Utility libraries and API clients
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## ✨ Key Features

### 1. User Authentication
- User registration with email/password
- Secure login system
- Session management via Supabase Auth
- User profiles

### 2. Role-Based Interfaces

#### Student Features
- **Book Available Slots**: View and book time slots created by teachers
- **View Upcoming Bookings**: See next 3 upcoming bookings on dashboard
- **Manage Bookings**: View all bookings and cancel if needed
- **Search Facilities**: Find available time slots

#### Teacher Features
- **Create Time Slots**: Make facilities available for booking
- **Manage Availability**: Set when rooms/facilities are available
- **View Bookings**: See who has booked time slots

### 3. Booking System

**Booking Types:**
- `available` - Time slot created by teacher (available for booking)
- `not_available` - Time slot that has been booked by a student

**Booking Properties:**
- Title (includes facility name)
- Start time (ISO timestamp)
- End time (ISO timestamp)
- Owner (user who created or booked it)
- Facility ID (reference to room/facility)
- Created timestamp

### 4. User Interface Components

**Reusable Components:**
- **BookingCard** - Display booking information in card format
- **BookingForm** - Create/manage bookings
- **ConfirmationModal** - Confirm actions (e.g., cancel booking)
- **Header** - Navigation and user info
- **ConditionalLayout** - Context-aware page layouts

### 5. API Endpoints

**Available APIs:**
- `GET /api/bookings` - List all bookings (admin/debug)
- `POST /api/bookings` - Create booking manually
- `GET /api/bookings/[id]` - Get specific booking
- Additional endpoints for booking operations

## 🔧 What You Can Do

### Development Tasks

1. **Run Development Server**
   ```bash
   cd booking-sys
   npm run dev
   ```
   Access at http://localhost:3000

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Run Linting**
   ```bash
   npm run lint
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

### Feature Development

You can:
- ✅ Add new booking features (notifications, reminders, etc.)
- ✅ Enhance UI components and styling
- ✅ Add new user roles (admin, staff, etc.)
- ✅ Implement advanced search/filtering
- ✅ Add booking analytics and reporting
- ✅ Create email notifications for bookings
- ✅ Implement recurring bookings
- ✅ Add capacity management for facilities
- ✅ Build a calendar view for bookings
- ✅ Add export functionality (PDF, CSV)
- ✅ Implement booking conflicts detection
- ✅ Add multi-language support (currently Danish)
- ✅ Create mobile-responsive views
- ✅ Add real-time booking updates
- ✅ Implement booking approval workflows

### Database Operations

Through Supabase, you can:
- Query bookings with complex filters
- Join booking data with facility/user data
- Implement Row Level Security (RLS) policies
- Create database triggers and functions
- Manage user authentication and authorization

### Code Quality Tasks

- Write unit tests for components
- Add integration tests for booking flows
- Implement E2E tests
- Add TypeScript strict mode
- Improve error handling
- Add logging and monitoring
- Optimize performance

## 📊 Database Schema

### Booking Table
```typescript
{
  booking_id: string;      // UUID
  title: string;           // Booking title (includes facility)
  role: 'available' | 'not_available';
  starts_at: string;       // ISO timestamp
  ends_at: string | null;  // ISO timestamp or null
  owner: string;           // User ID (UUID)
  facility_id: string | null;
  created_at?: string;     // Auto-generated
}
```

### Facility Table
- Contains room/facility information
- Has capacity field
- Linked to bookings via facility_id

## 🌐 Internationalization

Currently supports:
- Danish (da-DK) - Primary language
- Date/time formatting in Copenhagen timezone

## 🎨 Design System

- Color scheme: Blue-based (#1864AB primary)
- Typography: Geist font family
- Responsive design with mobile-first approach
- Component library: Mantine UI
- Icons: Tabler Icons

## 🔐 Security Considerations

- Supabase Row Level Security (RLS)
- User authentication required for all booking operations
- Server-side validation with Zod schemas
- HTTPS in production
- Environment variable management for secrets

## 📝 Development Guidelines

1. **Code Style**: Follow ESLint configuration
2. **TypeScript**: Use strict typing, avoid `any`
3. **Components**: Keep them reusable and testable
4. **API Routes**: Use Zod for validation
5. **Error Handling**: Use consistent error messages
6. **Formatting**: Danish date/time formats (da-DK)

## 🚀 Future Enhancements

Potential areas for expansion:
- Admin dashboard for system management
- Booking statistics and analytics
- Integration with external calendar systems
- SMS/Email notifications
- Mobile app (React Native)
- Waiting list functionality
- Resource sharing between facilities
- Booking templates
- Automated cleanup of past bookings
- Advanced reporting tools

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Mantine UI](https://mantine.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

When working on this project:
1. Understand the existing code structure
2. Follow the established patterns
3. Test your changes thoroughly
4. Update documentation as needed
5. Use meaningful commit messages
6. Run linting before committing

---

**Note**: This is an exam project (Eksamen) for a booking system, focused on demonstrating full-stack web development skills with modern technologies.
