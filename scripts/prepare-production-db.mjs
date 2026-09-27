import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  process.exit(0);
}

for (const [command, args] of [
  ["npx", ["prisma", "migrate", "deploy"]],
  ["npm", ["run", "db:bootstrap-admin"]],
]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
