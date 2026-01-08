export default {
  seed: "ts-node --project tsconfig.server.json prisma/seed.ts",
  truncate: "ts-node --project tsconfig.server.json prisma/truncate.ts",
};
