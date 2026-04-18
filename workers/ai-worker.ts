import { ensureAiWorker } from "@/lib/queue/worker";

async function main() {
  ensureAiWorker();
  console.log("Worker IA ativo.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
