# 📅 Treffpunkt – Find dates. Without stress.

A lightweight, mobile-first web app for collaborative scheduling. A modern alternative to Doodle – completely without forced registration, without ads, and without hidden hurdles.

🌐 **Live:** [treffpunkt.me](https://treffpunkt.me)

![Tech Stack](https://img.shields.io/badge/Next.js%2015-black?style=flat-square&logo=next.js)
![Tech Stack](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)
![Tech Stack](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase)

## ✨ Features

- **Fast Event Creation**: Set title, location, and dates (with or without times) in 3 simple steps.
- **No Registration**: The event creator simply shares the link. Anyone with the link can vote.
- **Security by Obscurity**: Events are protected by secure, long UUIDs.
- **Carpools**: Integrated module to offer rides and reserve seats directly within the event.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS (Vanilla CSS focus for custom properties)
- **Backend/Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## 🚀 Local Development

Want to run the project locally? Here is how:

1. **Clone the repository**
   ```bash
   git clone https://github.com/jonashdog/treffpunkt-app.git
   cd treffpunkt-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your Supabase keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Create database tables**
   Run the SQL commands in the Supabase SQL Editor to create the tables `events`, `date_options`, `votes`, `carpools` and `carpool_passengers`. (RLS must be disabled for the "no-registration" approach).

5. **Start the server**
   ```bash
   npm run dev
   ```
   The app is now running at `http://localhost:3000`.

## 🤝 Contributing

This is a small hobby project. If you find bugs, have suggestions for improvement, or want to add features like calendar exports (`.ics`): feel free to open an issue or submit a pull request!
