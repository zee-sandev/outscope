export const RPC_URL = new URL(
  "/rpc",
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
);
