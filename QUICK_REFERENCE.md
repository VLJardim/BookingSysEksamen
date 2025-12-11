# Quick Reference Guide - BookingSysEksamen

## "What can I do?" - Quick Answers

### For End Users

#### I'm a Student
```
✓ Book available time slots
✓ View my upcoming bookings  
✓ Cancel my bookings
✓ Search for available facilities
✓ See booking details (date, time, room, capacity)
```

#### I'm a Teacher
```
✓ Create available time slots
✓ Set facility availability
✓ View booking schedules
✓ Manage which rooms are bookable
```

### For Developers

#### Getting Started
```bash
# 1. Install dependencies
cd booking-sys
npm install

# 2. Set up environment variables (create .env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 3. Run development server
npm run dev

# 4. Open browser to http://localhost:3000
```

#### Common Development Tasks

**Add a new page:**
```bash
# Create a new route in app directory
touch app/my-new-page/page.tsx
```

**Add a new component:**
```bash
# Create component in src/components
touch src/components/MyComponent.tsx
```

**Add a new API endpoint:**
```bash
# Create API route
mkdir -p app/api/my-endpoint
touch app/api/my-endpoint/route.ts
```

**Run linting:**
```bash
npm run lint
```

**Build for production:**
```bash
npm run build
npm start
```

#### Code Examples

**Fetch bookings from Supabase:**
```typescript
const supabase = getBrowserSupabase();
const { data, error } = await supabase
  .from("booking")
  .select("*")
  .eq("owner", userId)
  .order("starts_at", { ascending: true });
```

**Create a new booking:**
```typescript
const { data, error } = await supabase
  .from("booking")
  .insert({
    title: "Room A - Meeting",
    starts_at: "2025-12-15T10:00:00Z",
    ends_at: "2025-12-15T11:00:00Z",
    facility_id: "facility-uuid",
    role: "available"
  });
```

**Use Mantine components:**
```typescript
import { Button, TextInput } from '@mantine/core';

<Button onClick={handleClick}>Click me</Button>
<TextInput label="Name" placeholder="Enter name" />
```

### Common Questions

**Q: How do I add a new feature?**
1. Plan your feature and understand existing code
2. Create necessary components in `src/components/`
3. Add pages in `app/` directory
4. Create API routes if needed in `app/api/`
5. Update types in `src/types/`
6. Test thoroughly

**Q: How do I modify the booking logic?**
- Check `src/lib/bookingApi.ts` for booking operations
- Review `src/types/booking.ts` for type definitions
- API routes are in `app/api/bookings/`

**Q: How do I change the UI styling?**
- Global styles: `app/globals.css`
- Tailwind classes: Use inline className
- Mantine theme: Check `src/components/MantineProvider.tsx`

**Q: How do I add authentication features?**
- Auth API: `src/lib/authApi.ts`
- Supabase auth: Already configured
- Login page: `app/login/page.tsx`
- Register page: `app/register/page.tsx`

**Q: Where are the forms?**
- All forms are in `src/forms/`
- Main booking form: `src/forms/bookingForm.tsx`

**Q: How do I add validation?**
- Schemas are in `src/lib/schemas/`
- Uses Zod for validation
- Example: `bookingCreateSchema`

### File Locations

```
Quick Reference Map:
├── User Authentication
│   ├── Login: app/login/page.tsx
│   ├── Register: app/register/page.tsx
│   └── Auth API: src/lib/authApi.ts
│
├── Booking Features
│   ├── Student View: app/student-home/page.tsx
│   ├── Teacher View: app/teacher-home/page.tsx
│   ├── My Bookings: app/my-bookings/page.tsx
│   ├── Booking API: src/lib/bookingApi.ts
│   └── Types: src/types/booking.ts
│
├── API Endpoints
│   ├── Bookings: app/api/bookings/route.ts
│   └── Specific Booking: app/api/bookings/[id]/route.ts
│
├── UI Components
│   ├── Components: src/components/
│   ├── Forms: src/forms/
│   └── Styles: app/globals.css
│
└── Configuration
    ├── Next.js: next.config.ts
    ├── TypeScript: tsconfig.json
    ├── Tailwind: postcss.config.mjs
    └── ESLint: eslint.config.mjs
```

### Environment Setup Checklist

- [ ] Node.js 20+ installed
- [ ] npm or yarn installed
- [ ] Created `.env.local` file
- [ ] Added Supabase credentials
- [ ] Ran `npm install`
- [ ] Ran `npm run dev` successfully
- [ ] Can access http://localhost:3000

### Useful npm Scripts

```bash
npm run dev       # Start dev server (with hot reload)
npm run build     # Create production build
npm start         # Run production build
npm run lint      # Check code quality
```

### Debugging Tips

**Check build errors:**
```bash
npm run build
# Look for TypeScript errors, missing imports, etc.
```

**Check linting issues:**
```bash
npm run lint
```

**View Supabase data:**
- Go to Supabase Dashboard
- Check Tables section
- View booking table data

**Common errors:**
- Missing environment variables → Check `.env.local`
- Supabase connection → Verify credentials
- Build errors → Check TypeScript types
- Runtime errors → Check browser console

### Next Steps

1. **Read the docs**: See [CAPABILITIES.md](./CAPABILITIES.md) for full details
2. **Explore the code**: Start with `app/page.tsx` and follow the flow
3. **Make changes**: Try modifying a page or component
4. **Test it**: Run the dev server and see your changes live
5. **Build it**: Run `npm run build` to ensure it compiles

---

**Need more help?** 
- Full documentation: [CAPABILITIES.md](./CAPABILITIES.md)
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- Mantine docs: https://mantine.dev
