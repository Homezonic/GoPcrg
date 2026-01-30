# GoPcrg Investment Platform

A modern investment platform built with React, TypeScript, Material-UI, and Supabase.

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd gopcrg
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Copy all content from `supabase/schema.sql` and paste into your Supabase SQL Editor, then execute.

### 4. Run

```bash
npm run dev
```

## Features

- 💰 Investment Plans Management
- 📊 User Dashboard with Real-time Stats
- 💳 Payment Processing & Verification
- 👥 User Management
- 🔐 Authentication (Email/Password)
- 📱 Responsive Design
- 🌙 Dark/Light Mode
- ⚙️ Admin Settings (Branding, Support, Custom Scripts)

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Material-UI v7, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: React Hooks, Context API
- **Notifications**: Notistack

## Project Structure

```
gopcrg/
├── src/
│   ├── pages/           # Application pages
│   │   ├── auth/        # Authentication pages
│   │   └── app/         # Protected app pages
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── lib/             # Utilities
│   └── style/           # Global styles
├── supabase/
│   └── schema.sql       # Complete database setup
└── public/              # Static assets
```

## Admin Features

- **Settings**: Site name, logo, support contacts
- **Payment Methods**: Configure available payment options
- **Plans**: Create/edit investment plans
- **Payments**: Verify user payments
- **Payouts**: Process user withdrawals
- **Users**: Manage platform users
- **Custom Scripts**: Add third-party integrations (analytics, chat widgets)

## Environment Variables

```env
VITE_SUPABASE_URL=        # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Your Supabase anonymous key
```

## Database Auto-deployment

Currently, database deployment is manual. Copy content from `supabase/schema.sql` and execute in Supabase SQL Editor.

For automated migrations, consider using [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Default Admin Account

After running the database schema, create an admin account:

1. Sign up normally through the app
2. In Supabase, update the user's role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## License

Private Project

---

Built with ❤️ using React + Supabase
