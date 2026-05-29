import { Buffer } from "node:buffer";
import { googleGemini } from "../client";
export { googleGemini };

export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  throw new Error("generateImageBuffer is not implemented using Google Gemini");
}

export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  throw new Error("editImages is not implemented using Google Gemini");
}
