# API Management Panel

A modern API management panel built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ **Authentication System**: Secure login/signup with Supabase Auth
- ✅ **Protected Routes**: Middleware-based route protection
- ✅ **Modern UI**: Clean, responsive design with Tailwind CSS
- 🔄 **Database Management**: Ready for three database management interfaces
- ⏳ **Real-time Updates**: Supabase real-time subscriptions (coming soon)
- ⏳ **User Management**: Role-based access control (coming soon)

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd api-management-panel
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the following SQL in your Supabase SQL editor to set up the basic schema:

```sql
-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sample database tables
CREATE TABLE public.database_1 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.database_2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.database_3 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_3 ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your use case)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Insert policies for your databases (example - adjust permissions as needed)
CREATE POLICY "Authenticated users can manage database_1" ON public.database_1
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage database_2" ON public.database_2
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage database_3" ON public.database_3
  FOR ALL USING (auth.role() = 'authenticated');
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── auth/
│   │   └── callback/       # Auth callback handler
│   ├── dashboard/          # Main dashboard
│   ├── api/
│   │   └── auth/           # Auth API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── auth/               # Authentication components
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── supabase/           # Supabase client configurations
│   └── utils.ts            # Utility functions
├── types/
│   └── database.ts         # Database type definitions
└── middleware.ts           # Route protection middleware
```

## Next Steps

### Phase 2: Core Features
- [ ] Build database management interfaces
- [ ] Implement CRUD operations for each database
- [ ] Add data visualization components
- [ ] Create user management system

### Phase 3: Advanced Features
- [ ] Add real-time updates with Supabase subscriptions
- [ ] Implement role-based access control
- [ ] Add export/import functionality
- [ ] Performance optimization and caching

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for auth callbacks) | Yes |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.