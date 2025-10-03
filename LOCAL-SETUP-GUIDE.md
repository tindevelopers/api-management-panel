# 🚀 Local Development Setup Guide

This guide will help you set up the API Management Panel locally on your machine.

## 📋 Prerequisites

Before you begin, make sure you have:
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Supabase account** - [Sign up here](https://supabase.com/)

## 🛠️ Step 1: Clone and Setup Project

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   cd api-management-panel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🔐 Step 2: Configure Environment Variables

1. **Copy the environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase credentials**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select an existing one
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon/public key**

3. **Update `.env.local`** with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   NODE_ENV=development
   ```

## 🗄️ Step 3: Setup Database Schema

1. **Go to your Supabase project dashboard**:
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the database schema**:
   - Copy the contents of `supabase-schema.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the schema

3. **Verify tables were created**:
   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - `users` - User profiles and roles
     - `database_1` - First database management table
     - `database_2` - Second database management table
     - `database_3` - Third database management table

## 🚀 Step 4: Start Development Server

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   - Navigate to [http://localhost:3001](http://localhost:3001)
   - You should see the login page

## 👤 Step 5: Create Your First Account

1. **Sign up for an account**:
   - Click "Don't have an account? Sign up"
   - Enter your email and password
   - Click "Sign Up"

2. **Confirm your email**:
   - Check your email for a confirmation link
   - Click the confirmation link
   - Return to the app and log in

## ✅ Step 6: Verify Everything Works

After logging in, you should have access to:
- **Dashboard** - Main application interface
- **Database Management** - Manage your three databases
- **API Testing** - Test API endpoints
- **User Profile** - View and edit your profile

## 🎯 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking

## 🔧 Development Features

### **Hot Reload**
The development server supports hot reload, so changes to your code will automatically refresh the browser.

### **TypeScript Support**
Full TypeScript support with type checking and IntelliSense.

### **ESLint Configuration**
Pre-configured ESLint rules for code quality and consistency.

### **Tailwind CSS**
Utility-first CSS framework for rapid UI development.

## 🛠️ Troubleshooting

### **Environment Variables Not Loading**
- Make sure `.env.local` is in the root directory
- Restart the development server after changing environment variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### **Supabase Connection Issues**
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure the database schema was applied successfully

### **Database Schema Issues**
- Make sure you ran the complete `supabase-schema.sql` file
- Check the Supabase logs for any errors
- Verify that Row Level Security (RLS) policies were created

### **Port Already in Use**
If port 3001 is already in use, you can change it:
```bash
npm run dev -- -p 3002
```

### **Build Issues**
- Run `npm run type-check` to identify TypeScript errors
- Run `npm run lint` to identify code quality issues
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## 📊 Sample Data

The database schema includes sample data for all three databases:
- **Database 1**: Production API, Staging API, Development API
- **Database 2**: User Management, Content Management, Analytics API
- **Database 3**: Payment Gateway, Notification Service, File Storage

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based permissions**: Admin > User > Viewer
- **Automatic user profile creation** on signup
- **Protected API routes** and middleware
- **CORS protection** and rate limiting

## 📝 Next Steps

Once you have the basic setup working:

1. **Explore the Dashboard** - Familiarize yourself with the interface
2. **Test API Endpoints** - Use the built-in API tester
3. **Configure Databases** - Set up your database connections
4. **Customize Roles** - Modify user roles and permissions as needed
5. **Add Your APIs** - Integrate your own API endpoints

## 🆘 Getting Help

If you encounter issues:
1. Check this troubleshooting guide
2. Review the Supabase dashboard logs
3. Check the browser console for errors
4. Verify all environment variables are set correctly

---

**Your API Management Panel is now ready for development!** 🎉

Happy coding! 🚀