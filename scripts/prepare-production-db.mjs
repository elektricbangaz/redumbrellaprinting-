import { spawnSync } from "node:child_process";

const commands = [["npx", ["prisma", "generate"]]];

if (process.env.VERCEL_ENV === "production") {
  commands.push(
    ["npx", ["prisma", "migrate", "deploy"]],
    ["npm", ["run", "db:bootstrap-admin"]],
  );
}

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
