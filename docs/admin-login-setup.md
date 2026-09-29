# First admin sign-in

The admin portal runs only on `admin.redumbrellaprinting.com` and its `www` alias. The public hosts return 404 for admin pages and APIs. The production `prebuild` step applies the committed Prisma migration and creates the first admin account if none exists.

In the Vercel `redumbrellaprinting` project, set these **Production** environment variables before deploying this change:

- `DATABASE_URL`: the Neon production branch connection string (already configured).
- `AUTH_SECRET`: a unique Auth.js signing secret (already configured).
- `ADMIN_BOOTSTRAP_EMAIL`: the inbox that should own the first admin account.
- `ADMIN_BOOTSTRAP_PASSWORD`: a unique password of at least 16 characters, entered directly in Vercel. Do not put it in Git or chat.
- `RESEND_API_KEY`: a Resend API key for sending password-reset links (and broadcasts).
- `RESEND_FROM_EMAIL`: a verified sender identity in Resend, for example `Red Umbrella Printing <orders@redumbrellaprinting.com>`.
- `ADMIN_APP_URL`: the canonical admin origin used in reset links, set to `https://www.admin.redumbrellaprinting.com` in Production.

Redeploy production after adding the variables. The build fails clearly if the database cannot migrate or the first account has no valid bootstrap email and password. If an ADMIN account already exists, the bootstrap step leaves it untouched. After the first successful build, remove `ADMIN_BOOTSTRAP_PASSWORD` from Vercel and redeploy; the account remains in Neon and its password hash remains valid.

Use `https://www.admin.redumbrellaprinting.com/login` to sign in. The apex admin host currently redirects to the `www` alias. `NEXTAUTH_URL` should match that canonical host, or be removed so Auth.js uses the request host. Do not point it at the public storefront.

The login page's password-reset flow emails a single-use link that expires after 30 minutes. Configure Resend's API key and a verified sender for delivery; the app never emails or stores a plaintext password.

The expanded dashboard uses clean routes on the admin host, including `/dashboard`, `/customers`, `/quotes`, `/catalog`, and `/orders`. The public `/products` storefront remains available; admin Products uses `/catalog` to avoid that collision.
