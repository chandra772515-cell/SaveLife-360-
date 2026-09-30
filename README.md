# SaveLife 360 — Emergency Response Platform

A static, front-end only demo of an ambulance dispatch platform connecting three roles:
**Public** (citizen requesting help), **Driver** (ambulance crew), and **Hospital** (ER coordination).

All "backend" behaviour is simulated in the browser: data lives in `localStorage`, state changes are
handled by a mock API layer, and pages are plain HTML/CSS/JS with no build step.

---

## Requirements

- A modern browser (Chrome, Edge, Firefox, Safari)
- Python 3.x **or** Node.js — only to run a static file server
- Internet access for the Leaflet map library and OpenStreetMap tiles

There is nothing to install: no `package.json`, no bundler, no dependencies to fetch.

---

## Running locally

The project uses relative paths (`css/`, `js/`, `../login.html`), so it must be served over HTTP.
Opening `index.html` directly with `file://` breaks relative navigation and `localStorage` isolation.

### Option 1 — Python (recommended)

```bash
cd "New folder"
python -m http.server 8000
```

Then open <http://localhost:8000>.

### Option 2 — Node.js

```bash
cd "New folder"
npx serve -l 8000
```

### Option 3 — VS Code

Install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.

### Troubleshooting

| Problem | Fix |
| --- | --- |
| `python` not found | Use `py -m http.server 8000` on Windows |
| Port already in use | Try another port, e.g. `python -m http.server 8080` |
| Blank / unstyled pages | You are on `file://` — use a server instead |
| Map tiles blank | Check network access to `unpkg.com` and `tile.openstreetmap.org` |

---

## Signing in

Go to <http://localhost:8000/login.html> (or click **Portal Login** on the landing page).

1. Pick a role card: **Public**, **Driver**, or **Hospital**.
2. Click **Quick Demo Login** (or submit the form — any email/password is accepted in demo mode).
3. You are redirected to that role's dashboard.

Pre-seeded demo identities (from `js/data.js`):

| Role | Name | Email |
| --- | --- | --- |
| Public | Sarah Jenkins | `sarah.j@example.com` |
| Driver | Marcus Vance | `driver.marcus@savelife360.org` |
| Hospital | Dr. Evelyn Reed (ER Desk) | `erdesk@metrohealth.org` |

Direct URLs (auth guard will sign you into the matching role automatically):

- Public — `public/dashboard.html`, `request-ambulance.html`, `tracking.html`, `hospitals.html`, `history.html`
- Driver — `driver/dashboard.html`, `requests.html`, `active-emergency.html`, `navigation.html`, `hospitals.html`, `history.html`
- Hospital — `hospital/dashboard.html`, `incoming.html`, `emergency-department.html`, `patients.html`, `beds.html`, `history.html`

> Roles are not isolated: opening a page from another role will switch the stored session to that
> role's demo user so any page can be demoed in isolation.

---

## Suggested demo flow

1. **Public** → *Request Ambulance* → submit a request.
2. **Driver** (second browser tab / private window) → *Requests* → accept the alert, then walk the
   active emergency: accept → en route → pick up → select hospital → arrive → complete.
3. **Hospital** (third tab) → *Incoming* → accept or reject the case, manage beds in *Beds*.
4. **Public** → *Tracking* to watch status, ETAs and the live map update in real time.

Notifications and status changes propagate across tabs because every write to `localStorage`
fires a `storage` event that `js/data.js` listens for.

---

## Project structure

```
.
├── index.html                 # Landing page
├── login.html                 # Role-based demo login
├── assets/                    # Images, icons, logos
├── css/
│   ├── style.css              # Base tokens, buttons, forms, landing page
│   ├── dashboard.css          # Portal shell, cards, tables, maps
│   └── responsive.css         # Mobile / tablet breakpoints
├── js/
│   ├── data.js                # Seed data + persistent state store (localStorage)
│   ├── api.js                 # Mock async API (login, dispatch, bed updates)
│   ├── auth.js                # Session handling + role guards
│   ├── main.js                # Landing page behaviour
│   ├── notifications.js       # Cross-role notification centre
│   ├── map.js                 # Leaflet map + canvas radar fallback
│   ├── public.js              # Citizen portal logic
│   ├── driver.js              # Ambulance crew logic
│   └── hospital.js            # ER coordination logic
├── public/                    # Citizen portal pages
├── driver/                    # Ambulance crew pages
├── hospital/                  # Hospital portal pages
└── .gitignore
```

---

## How the data layer works

- **Seed data** — `js/data.js` holds the initial ambulances, hospitals, emergencies, and history.
- **State store** — `SaveLifeDataStore` keeps a single state object, persisted to `localStorage`
  under `SAVELIFE360_STATE_V1`. Edit it in DevTools → Application → Local Storage to inspect or
  tamper with data during a demo.
- **API layer** — `js/api.js` exposes `SaveLifeAPI`, an async, promise-based interface
  (`createEmergency`, `acceptEmergency`, `selectHospital`, `updateHospitalBeds`, …) that mirrors a
  REST backend. Swapping in real endpoints means replacing the bodies of these methods with
  `fetch()` calls; no page code needs to change.
- **Auth** — the logged-in user is stored under `SAVELIFE360_AUTH_USER`. Demo mode accepts any
  credentials and never validates a password.

---

## Resetting demo data

Either of these works:

- Browser DevTools → Application → Local Storage → delete `SAVELIFE360_STATE_V1`
  (and `SAVELIFE360_AUTH_USER` to log out), then reload.
- In the browser console:

  ```js
  SaveLifeAPI.resetDemoData().then(() => location.reload());
  ```

  or a full sign-out:

  ```js
  SaveLifeAuth.logout();
  ```

---

## Notes and limitations

- **Demo data only.** Names, addresses, phone numbers, coordinates, and map movements are
  fabricated. No real emergency services are contacted.
- **Maps** use Leaflet 1.9.4 from unpkg with OpenStreetMap tiles. Offline, `js/map.js` falls back
  to an animated canvas radar so the pages still work.
- **No real authentication, encryption, or backend.** Do not enter genuine personal or medical data.
- **Browser support** — requires ES6, `localStorage`, and CSS custom properties.

---

## Tech stack

HTML5 · CSS3 (custom properties, flexbox/grid) · Vanilla JavaScript (IIFE modules, no framework) ·
Leaflet 1.9.4 · `localStorage` persistence
