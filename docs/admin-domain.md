# Red Umbrella admin domain

Admin URLs: https://admin.redumbrellaprinting.com and https://www.admin.redumbrellaprinting.com. The current Vercel domain setting redirects the former to the latter; both hosts are recognized by middleware. To use the shorter address in the browser, change the primary-domain redirect in Vercel.

Deploy the same Next.js project on both the public domain and the admin subdomain. Attach both admin hostnames to the Vercel project's Domains settings and point its DNS record to Vercel as instructed in that settings page. Creating a DNS subdomain alone does not attach it to a deployment.

Set a strong, private `AUTH_SECRET` and the production `DATABASE_URL` in the Vercel production environment. Configure the auth base URL for the admin origin (`AUTH_URL=https://admin.redumbrellaprinting.com` if your deployment needs an explicit URL). Do not reuse the development secret in production. Provision an admin user with a bcrypt password hash in `AdminUser` through a secure provisioning process. If running `npm run db:seed`, set a unique `SEED_ADMIN_PASSWORD` (at least 16 characters); the seed refuses to run without it. The login screen does not offer public registration.

The public host must return 404 for `/admin`, `/admin/orders`, `/api/admin/*` and `/api/auth/*`. On the admin host, visit `/` unauthenticated to reach `/login`, sign in, and verify `/orders`, `/work-orders`, `/purchase-orders`, and `/broadcasts`. Check that signing out returns to `/login`; old `/admin/*` URLs should redirect to clean paths on the admin host. Confirm unauthenticated `/api/admin/*` requests are denied and public storefront pages do not render on the admin host.

The admin implementation remains in the internal `app/admin` directory; middleware rewrites requests without showing this path in the browser.
