# Carbonless 🌱

**A sustainable-mobility and carbon-savings tracker built with React, Vite and Firebase.**

Carbonless helps people log everyday trips, estimate avoided CO₂ emissions compared with a passenger-car baseline, follow personal progress, and connect with other users. Its community view displays aggregated locality activity for selected areas in Ghaziabad.

## Features

- **Trip logging:** record walking, cycling, metro, bus and car trips.
- **CO₂ estimates:** calculate estimated emissions avoided for each trip.
- **Progress dashboard:** view total savings, weekly activity, streaks, XP and divisions.
- **Missions and challenges:** track personal and community-oriented goals.
- **Community map:** explore aggregated locality activity on an OpenStreetMap-powered map.
- **Friends and chat:** send/accept friend requests and message accepted friends.
- **Firebase authentication:** guest/anonymous sign-in, with optional Google and email/password providers when enabled in Firebase.
- **Live data:** user profiles, trips, leaderboard and community aggregates use Cloud Firestore.
- **Offline-aware experience:** Firestore's persistent local cache can queue supported writes while offline.
- **Themes:** switch between dark and light appearance.
- **Extended interface:** the legacy extended UI is available at `public/carbonless.html` and can be opened from Settings.

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 18 |
| Build tooling | Vite 5 |
| Authentication and database | Firebase Authentication, Cloud Firestore |
| Maps | Leaflet + OpenStreetMap tiles |
| Reports | jsPDF |
| Tests | Vitest |
| Hosting configuration | Vercel |

## Getting started

### Requirements

- Node.js 18 or newer (Node.js 20 LTS is recommended)
- npm
- A Firebase project with Authentication and Cloud Firestore enabled

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/carbonless.git
cd carbonless
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

The Firebase client configuration is currently defined in `src/firebase.js`.

1. Create or select a Firebase project.
2. Register a Web app in Firebase project settings.
3. Update the `cfg` object in `src/firebase.js` with that project's **web app configuration**.
4. In Firebase Console → Authentication → Sign-in method, enable **Anonymous** authentication for the guest-first flow.
5. Enable Google and/or Email/Password only if you want those sign-in options.
6. In Authentication settings → Authorized domains, add your local development host and deployed domain.
7. Create a Cloud Firestore database.
8. Publish the rules and indexes from this repository:
   - Rules: `firestore.rules`
   - Indexes: `firestore.indexes.json`

> **Security note:** Firebase web-app configuration (including the web API key) is included in client-side code and is not a private server credential. Restrict the API key to the required APIs and your application domains where appropriate. Never commit Firebase Admin SDK service-account JSON files, private keys, passwords, or other server secrets. Review Firestore rules before using real user data.

### 4. Run locally

```bash
npm run dev
```

Vite will print the local development URL (usually `http://localhost:5173`).

### 5. Run tests and production build

```bash
npm test
npm run build
npm run preview
```

The production build is generated in `dist/`.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) with GitHub.
3. Import the `carbonless` repository.
4. Use the Vite defaults:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
5. Deploy, then add the deployed hostname to Firebase Authentication's authorized domains.
6. Test guest sign-in, trip logging, challenges, community data and friend interactions on the deployed site.

The included `vercel.json` rewrites app routes to `index.html`.

## Project structure

```text
carbonless/
├── public/
│   └── carbonless.html       # Legacy extended interface
├── src/
│   ├── App.jsx               # App entry and auth state
│   ├── AuthScreen.jsx        # Sign-in / guest entry
│   ├── Dashboard.jsx         # Main dashboard and Firestore subscriptions
│   ├── Challenges.jsx        # Challenges
│   ├── Community.jsx         # Locality map and leaderboard
│   ├── Friends.jsx           # Friend requests and chat
│   ├── Settings.jsx          # Settings and extended UI link
│   ├── carbon.js             # Emission estimates and progress logic
│   ├── carbon.test.js        # Unit tests
│   ├── firebase.js           # Firebase client initialization
│   ├── main.jsx              # React entry point
│   ├── report.js             # Report generation
│   ├── styles.css            # App styles
│   └── widgets.jsx           # Dashboard widgets
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore index configuration
├── firebase.json             # Firebase CLI configuration
├── vercel.json               # Vercel SPA rewrite
├── vite.config.js
├── package.json
└── README.md
```

## Important limitations and responsible-use notes

- **Illustrative emission factors:** values in `src/carbon.js` are estimates, not official or independently verified regional measurements. The current passenger-car baseline is 192 g CO₂/km. Treat dashboard totals as indicative.
- **Client-calculated rewards:** trip savings, XP and leaderboard totals are calculated or updated by the client. Firestore rules provide validation, but this is not a tamper-proof scoring system. For production-grade rewards, move trusted calculations to a server-side environment such as Cloud Functions.
- **Community aggregation:** the app hides a locality until it reaches the configured minimum trip count. This is a display threshold, not a substitute for reviewing the complete privacy and security model.
- **Legacy interface:** `public/carbonless.html` remains a separate legacy page and is not fully refactored into the React application.
- **Provider setup:** sign-in options depend on which Firebase Authentication providers are enabled in your own Firebase project.

## Screenshots

Add current screenshots of the running app here before sharing the repository publicly. Suggested captures:

1. Dashboard overview
2. Challenges
3. Ghaziabad community map
4. Friends and chat
5. Settings / extended interface

For example, save images under `docs/screenshots/` and embed them here:

```md
![Carbonless dashboard](docs/screenshots/dashboard.png)
```

## Contributing

Issues and pull requests are welcome. For significant changes, open an issue first to discuss the proposed change.

## License

No license is currently included. If you want others to reuse, modify or distribute this project, choose and add an appropriate open-source license before describing the repository as open source.
