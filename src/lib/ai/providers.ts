import { logger } from "@/lib/logger";

export interface BackgroundRemovalProvider {
  removeBackground(imageBuffer: Buffer): Promise<Buffer>;
}

export class RemoveBgProvider implements BackgroundRemovalProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    logger.info("Executing background removal via Remove.bg API");

    const formData = new FormData();
    // Wrap in Uint8Array to satisfy BlobPart typing across Node/browser environments
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
    formData.append("image_file", blob, "input.png");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, "Remove.bg API failed");
      throw new Error(`Remove.bg background removal failed: ${response.statusText} (${errorText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Factory function to retrieve the configured background removal provider.
 * Extensible for other providers like Fal.ai, Clipdrop, etc.
 */
export function getBackgroundRemovalProvider(): BackgroundRemovalProvider {
  const removeBgKey = process.env.REMOVE_BG_API_KEY;

  if (!removeBgKey) {
    throw new Error("No background removal API key configured in environment");
  }

  logger.debug("Instantiating active background removal provider: Remove.bg");
  return new RemoveBgProvider(removeBgKey);
}
