-- API Management Panel Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sample database tables for your three databases
CREATE TABLE IF NOT EXISTS public.database_1 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.database_2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.database_3 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_3 ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for database tables
-- Admin users can do everything
CREATE POLICY "Admin users can manage database_1" ON public.database_1
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Regular users can view database_1" ON public.database_1
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user', 'viewer')
    )
  );

CREATE POLICY "Users can modify database_1" ON public.database_1
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user')
    )
  );

-- Similar policies for database_2
CREATE POLICY "Admin users can manage database_2" ON public.database_2
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Regular users can view database_2" ON public.database_2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user', 'viewer')
    )
  );

CREATE POLICY "Users can modify database_2" ON public.database_2
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user')
    )
  );

-- Similar policies for database_3
CREATE POLICY "Admin users can manage database_3" ON public.database_3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Regular users can view database_3" ON public.database_3
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user', 'viewer')
    )
  );

CREATE POLICY "Users can modify database_3" ON public.database_3
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'user')
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample data
INSERT INTO public.database_1 (name, description) VALUES 
('Production API', 'Main production API endpoint'),
('Staging API', 'Staging environment for testing'),
('Development API', 'Development environment API');

INSERT INTO public.database_2 (name, description) VALUES 
('User Management', 'User authentication and profile management'),
('Content Management', 'Content creation and management system'),
('Analytics API', 'Analytics and reporting endpoints');

INSERT INTO public.database_3 (name, description) VALUES 
('Payment Gateway', 'Payment processing and billing'),
('Notification Service', 'Email and push notification system'),
('File Storage', 'File upload and storage management');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_1_updated_at BEFORE UPDATE ON public.database_1
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_2_updated_at BEFORE UPDATE ON public.database_2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_database_3_updated_at BEFORE UPDATE ON public.database_3
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
