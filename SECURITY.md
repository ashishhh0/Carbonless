# Security policy

## Reporting a vulnerability

Please do not publish exploitable security details in a public issue. Contact the repository owner privately with a clear description and steps to reproduce.

## Before deploying

- Never commit Firebase Admin SDK service-account files, private keys, passwords or `.env` files.
- Keep Firestore rules restrictive and test them against every supported user flow.
- Restrict the Firebase web API key to the APIs and domains required by this app.
- Review data collection, retention and access before inviting real users.
- Treat client-generated trip totals, XP and leaderboard scores as untrusted input.
