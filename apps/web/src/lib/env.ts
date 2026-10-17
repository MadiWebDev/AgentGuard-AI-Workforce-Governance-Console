import { z } from "zod";
const schema = z.object({ DATABASE_URL: z.string().optional(), BETTER_AUTH_SECRET: z.string().optional(), APP_URL: z.string().default("http://localhost:3000"), NODE_ENV: z.string().default("development"), STORAGE_MODE: z.string().default("local"), PADDLE_ENV: z.string().default("sandbox") });
export function getEnv() { return schema.parse({ DATABASE_URL: process.env.DATABASE_URL, BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET, APP_URL: process.env.APP_URL, NODE_ENV: process.env.NODE_ENV, STORAGE_MODE: process.env.STORAGE_MODE, PADDLE_ENV: process.env.PADDLE_ENV }); }
export function assertProductionAdapters() { const env = getEnv(); if (env.NODE_ENV==="production" && env.STORAGE_MODE==="local") throw new Error("Local storage adapter rejected in production"); }
