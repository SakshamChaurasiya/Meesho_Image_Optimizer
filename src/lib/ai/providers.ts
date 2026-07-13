import { logger } from "@/lib/logger";
import { removeBackground } from "@imgly/background-removal-node";

export interface BackgroundRemovalResult {
  buffer: Buffer;
  backgroundProvider: string;
  fallbackUsed: boolean;
}

export interface BackgroundRemovalProvider {
  remove(imageBuffer: Buffer): Promise<BackgroundRemovalResult>;
}

export class ImglyProvider implements BackgroundRemovalProvider {
  async remove(imageBuffer: Buffer): Promise<BackgroundRemovalResult> {
    try {
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
      const resultBlob = await removeBackground(blob);
      const arrayBuffer = await resultBlob.arrayBuffer();
      
      logger.info("Imgly processing completed");
      
      return {
        buffer: Buffer.from(arrayBuffer),
        backgroundProvider: "imgly",
        fallbackUsed: false,
      };
    } catch (err) {
      logger.error({ err }, "Imgly provider failed");
      throw err;
    }
  }
}

/**
 * Factory function to retrieve the configured background removal provider.
 * Returns ImglyProvider as the sole background removal provider.
 */
export function getBackgroundRemovalProvider(): BackgroundRemovalProvider {
  logger.debug("Instantiating ImglyProvider for background removal");
  return new ImglyProvider();
}
