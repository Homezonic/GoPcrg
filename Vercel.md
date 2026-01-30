# Deploy GoPcrg to Vercel

## Option 1: Via Vercel Dashboard (Easiest)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Import to Vercel

Go to vercel.com
Click "Add New" → "Project"
Import your GitHub repository
Vercel auto-detects Vite settings

### 3. Add Environment Variables

In Vercel project settings → Environment Variables:

```bash
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

### 4. Deploy

Click "Deploy"
Done! ✅

## Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables when prompted
# Or add them in .env and run:
vercel env pull

# Deploy to production
vercel --prod
```

### Important Configuration

Build Command: `npm run build` (auto-detected)
Output Directory: `dist` (auto-detected)
Framework: Vite (auto-detected)
Node Version: Set to 18.x or higher in Vercel settings if needed

### Configuration

The project already includes `vercel.json` for SPA routing:

```bash
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures all routes work correctly (no 404s on page refresh).

## After Deployment

Your app will be live at `https://your-project.vercel.app`
Every push to `main` branch auto-deploys
Pull requests get preview deployments
Custom domain can be added in Vercel settings

### Troubleshooting

Environment Variables Not Working

- Make sure variables start with `VITE_`
- Redeploy after adding new variables

### 404 on Routes

- Ensure `vercel.json` exists with the rewrite rule above

### Build Fails

- Check Node version in Vercel settings (use 18.x+)
- Verify `package.json` has correct build script

🚀 That's it! Your app is now live on Vercel.
