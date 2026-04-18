import IORedis from "ioredis";

let redisConnection: IORedis | null = null;

function getRedisUrlFromEnv() {
  return (
    process.env.UPSTASH_REDIS_URL ||
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_KV_REST_API_URL?.replace(/^https?:\/\//, "redis://") ||
    ""
  );
}

export function getRedisConnection() {
  if (redisConnection) {
    return redisConnection;
  }

  const connectionUrl = getRedisUrlFromEnv();

  if (connectionUrl) {
    redisConnection = new IORedis(connectionUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: connectionUrl.startsWith("rediss://") ? {} : undefined,
    });
    return redisConnection;
  }

  const host = process.env.REDIS_HOST;
  const port = Number(process.env.REDIS_PORT ?? "6379");
  const password = process.env.REDIS_PASSWORD;

  if (!host) {
    throw new Error("Redis não configurado. Defina UPSTASH_REDIS_URL ou REDIS_HOST.");
  }

  redisConnection = new IORedis({
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  return redisConnection;
}
