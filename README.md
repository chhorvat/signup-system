# Basketball League Signup

A lightweight web app for managing pickup basketball game signups with a player cap, automatic waitlist promotion, and player accountability tracking.

## Features

- **Daily game days** — admin creates games with date, time, location, and player cap (default 12)
- **Simple signup** — players sign up with just a name and email, no account required
- **Automatic waitlist** — players 13+ go on a numbered waitlist; when someone cancels, #1 on the waitlist is promoted instantly and emailed
- **Magic link cancellation** — every signup gets a unique cancel link in their confirmation email; same-browser users see an inline Cancel button
- **Attendance tracking** — admin marks who showed up or no-showed after each game
- **Reliability stats** — per-player statistics: attendance rate, total day-of cancellations, grace period filtering
- **Admin dashboard** — create/manage game days, view full rosters with emails, add/remove players

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Password to access `/admin` | — (required) |
| `DB_PATH` | Path to SQLite database file | `./data/signup.db` |
| `APP_URL` | Public URL (used in email cancel links) | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server host | — (emails skipped if unset) |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | From address for emails | `Basketball League <noreply@example.com>` |

**Email is optional** — the app works without it. Cancel tokens are stored in localStorage so same-browser users can still cancel.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### For players

1. Go to the home page — upcoming games are listed with spot availability
2. Click a game → fill in your name and email → click **Sign Up**
3. If spots are available: you're confirmed. If full: you're added to the numbered waitlist
4. You'll receive a confirmation email with a cancel link
5. To cancel: click the link in your email, or use the **Cancel my signup** button that appears on the same browser

### For admin

Go to [/admin](http://localhost:3000/admin) and log in with your `ADMIN_PASSWORD`.

**Dashboard** — lists all game days with spot counts. Create new games here.

**Game management** (`/admin/game/[date]`) — full roster with emails, remove players, add players manually.

**Attendance** — after a game, use the ✓/✗ buttons on each player row to record who showed up.

**Stats** (`/admin/stats`) — player reliability leaderboard:
- **Attendance rate** — how often they show up when confirmed (requires marking attendance)
- **Day-of cancellation rate** — how often they cancel within 24 hours of game time
- Cancellations within 10 minutes of signing up are excluded (grace period for accidental signups)

---

## Deployment

The app uses SQLite, so you need a server with a **persistent filesystem** (not serverless).

### Option A: Railway / Render / Fly.io

1. Create a persistent volume and set `DB_PATH` to point to it (e.g., `/data/signup.db`)
2. Set all environment variables in the platform dashboard
3. Deploy — the DB initializes automatically on first start

### Option B: VPS with pm2

```bash
npm run build
pm2 start npm --name "basketball" -- start
```

---

## Project Structure

```
app/
  page.tsx                    # Public home — upcoming games
  game/[date]/page.tsx        # Public game page — roster, waitlist, signup form
  cancel/[token]/page.tsx     # Magic link cancellation page
  admin/
    page.tsx                  # Admin dashboard
    game/[date]/page.tsx      # Roster management + attendance
    stats/page.tsx            # Player reliability stats
    login/page.tsx            # Admin login

lib/
  signups.ts     # Core logic: createSignup, cancelSignup, promoteFromWaitlist
  gameDays.ts    # Game day CRUD
  stats.ts       # Player reliability and cancellation statistics
  email.ts       # Email notifications (confirmation, waitlist, promotion)
  auth.ts        # Admin session management

db/
  schema.sql     # SQLite schema (auto-applied on startup)
  index.ts       # Database connection singleton + migration
```

---

## Accountability Notes

**Day-of cancellation** is defined as cancelling a confirmed spot within 24 hours of the scheduled game time.

**Grace period**: A cancellation within 10 minutes of signing up is excluded from day-of stats — this protects against accidental double-signups and immediate corrections counting against a player's reliability score.

**No-show tracking**: After each game, the admin marks attendance. No-shows are tracked separately from cancellations. Both metrics appear on the Stats page.
