# Blog setup

The blog uses the Firebase project already configured for sign-in. Before using
the dashboard for the first time:

1. In the Firebase console for `money-box-dcc11`, create a Cloud Firestore
   database in production mode.
2. Open **Firestore Database → Rules**, replace the rules with the contents of
   [`firestore.rules`](./firestore.rules), and publish them. GitHub Pages does
   not deploy Firebase security rules.
3. In **Authentication → Sign-in method**, enable Email/Password. If you use
   GitHub Pages or a custom domain, add that site under **Authentication →
   Settings → Authorized domains**.
4. Create or sign up for `omaryagoub77@gmail.com`. The sign-up page sends a
   verification email for this account; verify it before signing in.
5. Sign in at `signin.html`, then open `admin.html` to write, save drafts, and
   publish posts. Published posts appear at `blog.html`.

The dashboard checks the allowed, verified email for a friendly access gate,
and Firestore rules independently enforce the same restriction on writes.
Public visitors can read published posts only.
