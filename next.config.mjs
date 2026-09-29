/** @type {import("next").NextConfig} */
const nextConfig = {
  // Preview deployments are used for visual QA while the branch is under active
  // reconstruction. Production continues to enforce TypeScript build errors.
  typescript: {
    ignoreBuildErrors: process.env.VERCEL_ENV === "preview",
  },
};

export default nextConfig;
