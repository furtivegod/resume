# Using ngrok with VPN

## Quick Setup:

1. **Download ngrok:**
   - Go to https://ngrok.com/download
   - Download for Windows
   - Extract the ngrok.exe file

2. **Get your authtoken (optional but recommended):**
   - Sign up at https://dashboard.ngrok.com/signup (free)
   - Get your authtoken from the dashboard
   - Run: `ngrok config add-authtoken YOUR_TOKEN`

3. **Start your Next.js app:**
   ```bash
   npm run dev
   ```

4. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

5. **Use the ngrok URL:**
   - ngrok will give you a URL like: `https://abc123.ngrok.io`
   - Use this URL in your browser instead of localhost
   - This URL works even with VPN!

## Alternative: Deploy to Vercel (Permanent Solution)

Since you're using Next.js, you can deploy for free on Vercel:

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Deploy (takes 2 minutes)
5. Get a permanent URL like: `https://your-app.vercel.app`

This is free and works with VPN!

