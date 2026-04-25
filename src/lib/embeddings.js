"use client";

let pipeline = null;
let loadPromise = null;

async function loadPipeline() {
  if (pipeline) return pipeline;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const { pipeline: createPipeline, env } = await import(
      "@xenova/transformers"
    );

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    pipeline = await createPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    return pipeline;
  })();

  return loadPromise;
}

export async function generateEmbedding(text, onProgress) {
  const extractor = await loadPipeline();
  if (onProgress) onProgress("Generating semantic embedding...");

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}