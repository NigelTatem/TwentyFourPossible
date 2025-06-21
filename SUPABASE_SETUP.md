# Supabase Setup & User Management Guide

## 🚀 Initial Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Create a new organization (if needed)
4. Create a new project
5. Choose a region close to your users
6. Set a secure database password

### 2. Get Your Project Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://abc123.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables
Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 📊 Database Schema Setup

### 4. Create Database Tables
Go to **SQL Editor** in Supabase and run this script:

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  streak INTEGER DEFAULT 0,
  total_challenges INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges Table
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  goal TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  rating INTEGER,
  outcome TEXT,
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-ins Table
CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  challenge_id TEXT REFERENCES challenges(id),
  milestone INTEGER NOT NULL,
  mood TEXT NOT NULL,
  reflection TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own challenges" ON challenges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own check-ins" ON check_ins
  FOR ALL USING (auth.uid() = (SELECT user_id FROM challenges WHERE id = challenge_id));

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 👥 Managing Users

### Through Supabase Dashboard

#### **Authentication Tab**
- **View all users**: See email, signup date, last login
- **Delete users**: Remove accounts (this cascades to all their data)
- **Reset passwords**: Send password reset emails
- **User details**: View metadata, sessions, and activity

#### **Database Tab**
- **user_profiles table**: See user stats and preferences
- **challenges table**: View all completed challenges
- **check_ins table**: See milestone check-in data

### Useful SQL Queries

```sql
-- View user stats
SELECT 
  u.email,
  p.total_challenges,
  p.created_at as signup_date
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY p.created_at DESC;

-- Most active users
SELECT 
  u.email,
  p.total_challenges,
  COUNT(c.id) as challenges_in_db
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
LEFT JOIN challenges c ON u.id = c.user_id
GROUP BY u.id, u.email, p.total_challenges
ORDER BY p.total_challenges DESC;

-- Recent signups
SELECT 
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Challenge completion rates
SELECT 
  DATE_TRUNC('day', c.created_at) as date,
  COUNT(*) as challenges_started,
  COUNT(CASE WHEN c.completed THEN 1 END) as challenges_completed
FROM challenges c
GROUP BY DATE_TRUNC('day', c.created_at)
ORDER BY date DESC;
```

## 🔧 Advanced Management

### Email Templates
**Authentication** → **Email Templates**
- Customize signup confirmation emails
- Password reset email styling
- Magic link emails

### Analytics
**Reports** → **Auth**
- Daily/monthly active users
- Signup trends
- Geographic distribution

### Security
**Authentication** → **Settings**
- Email confirmation requirements
- Password requirements
- Session timeout settings
- Multi-factor authentication

## 🚨 Data Export & Backup

### Export User Data
```sql
-- Export all user data for GDPR compliance
SELECT 
  u.email,
  u.created_at as signup_date,
  p.total_challenges,
  json_agg(
    json_build_object(
      'goal', c.goal,
      'completed_at', c.end_time,
      'rating', c.rating,
      'outcome', c.outcome
    )
  ) as challenges
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
LEFT JOIN challenges c ON u.id = c.user_id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.created_at, p.total_challenges;
```

### Database Backups
- **Automatic**: Supabase provides daily backups
- **Manual**: Database → Backups → Create backup
- **Point-in-time recovery**: Available on paid plans

## 📈 Monitoring & Alerts

### Set Up Monitoring
1. **Database** → **Reports** for performance metrics
2. **Authentication** → **Rate Limits** for abuse prevention
3. **Edge Functions** → **Logs** for debugging

### Usage Quotas
- **Free tier**: 50,000 monthly active users
- **Database storage**: 500MB free
- **Bandwidth**: 1GB free per month

## 🔐 Privacy & Compliance

### Data Retention
- User data persists until manually deleted
- Session data expires automatically
- Audit logs available for security review

### GDPR Compliance
- Users can request data export
- Right to deletion (cascade deletes all user data)
- Data processing agreements available

## 🛠️ Troubleshooting

### Common Issues
1. **RLS policies**: Ensure users can access their own data
2. **API keys**: Use public key for client, service key for admin
3. **CORS**: Configure allowed origins in Supabase settings

### Support Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.com)
- Support tickets for paid plans 