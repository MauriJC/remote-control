import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  authToken: process.env.AUTH_TOKEN ?? "",
};
