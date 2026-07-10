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

export class RemoveBgProvider implements BackgroundRemovalProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async remove(imageBuffer: Buffer): Promise<BackgroundRemovalResult> {
    logger.info("Remove.bg request started");

    try {
      const formData = new FormData();
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
        logger.info("Remove.bg failed");
        logger.error({ status: response.status, error: errorText }, "Remove.bg API failed");
        throw new Error(`Remove.bg background removal failed: ${response.statusText} (${errorText})`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        backgroundProvider: "removebg",
        fallbackUsed: false,
      };
    } catch (err) {
      logger.info("Remove.bg failed");
      logger.error({ err }, "Remove.bg exception encountered");
      throw err;
    }
  }
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

export class FallbackBackgroundRemovalProvider implements BackgroundRemovalProvider {
  private primary: BackgroundRemovalProvider;
  private fallback: BackgroundRemovalProvider;
  private primaryName: string;
  private fallbackName: string;

  constructor(
    primary: BackgroundRemovalProvider,
    fallback: BackgroundRemovalProvider,
    primaryName: string,
    fallbackName: string
  ) {
    this.primary = primary;
    this.fallback = fallback;
    this.primaryName = primaryName;
    this.fallbackName = fallbackName;
  }

  async remove(imageBuffer: Buffer): Promise<BackgroundRemovalResult> {
    try {
      const result = await this.primary.remove(imageBuffer);
      return {
        ...result,
        fallbackUsed: false,
      };
    } catch (primaryErr) {
      const friendlyFallbackName = this.fallbackName === "imgly" ? "Imgly" : this.fallbackName;
      logger.info({ err: primaryErr }, `Switching to ${friendlyFallbackName} provider`);
      
      try {
        const result = await this.fallback.remove(imageBuffer);
        logger.info("Returning fallback result");
        return {
          ...result,
          fallbackUsed: true,
        };
      } catch (fallbackErr) {
        logger.error({ err: fallbackErr }, `${friendlyFallbackName} fallback provider also failed`);
        throw fallbackErr;
      }
    }
  }
}

/**
 * Factory function to retrieve the configured background removal provider.
 * Uses fallback chaining based on BACKGROUND_PROVIDER and BACKGROUND_FALLBACK.
 */
export function getBackgroundRemovalProvider(): BackgroundRemovalProvider {
  const providerType = process.env.BACKGROUND_PROVIDER || "removebg";
  const fallbackType = process.env.BACKGROUND_FALLBACK || "imgly";

  const createProvider = (type: string): BackgroundRemovalProvider => {
    if (type === "removebg") {
      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        throw new Error("No background removal API key configured in environment");
      }
      return new RemoveBgProvider(apiKey);
    } else if (type === "imgly") {
      return new ImglyProvider();
    } else {
      throw new Error(`Unknown background removal provider: ${type}`);
    }
  };

  const primary = createProvider(providerType);
  
  if (fallbackType && fallbackType !== providerType) {
    const fallback = createProvider(fallbackType);
    logger.debug(`Instantiating fallback provider system: ${providerType} -> ${fallbackType}`);
    return new FallbackBackgroundRemovalProvider(primary, fallback, providerType, fallbackType);
  }

  logger.debug(`Instantiating single provider: ${providerType}`);
  return primary;
}
