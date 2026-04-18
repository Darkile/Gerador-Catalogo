import { Queue, QueueEvents } from "bullmq";
import { getRedisConnection } from "@/lib/queue/redis";

export const AI_IMAGE_QUEUE_NAME = "catalog-image-processing";

export interface AiImageJobData {
  aiJobId: string;
  catalogId: string;
  productId: string;
  imageUrl: string;
}

let aiImageQueue: Queue<AiImageJobData> | null = null;
let aiImageQueueEvents: QueueEvents | null = null;

export function getAiImageQueue() {
  if (!aiImageQueue) {
    aiImageQueue = new Queue<AiImageJobData>(AI_IMAGE_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 500,
        removeOnFail: 500,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1500,
        },
      },
    });
  }

  return aiImageQueue;
}

export function getAiImageQueueEvents() {
  if (!aiImageQueueEvents) {
    aiImageQueueEvents = new QueueEvents(AI_IMAGE_QUEUE_NAME, {
      connection: getRedisConnection(),
    });
  }

  return aiImageQueueEvents;
}
