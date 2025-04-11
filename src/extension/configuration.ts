import * as vscode from "vscode";
import { BridgeMessage } from "../common/types";

export async function getConfig(): Promise<BridgeMessage> {
  const config = vscode.workspace.getConfiguration("vsc-cursor-animations");
  const velocity = config.get<number>("velocity");
  const opacity = config.get<number>("opacity");
  const imageUrl = config.get<string>("backgroundImageUrl");
  return {
    type: "config-response",
    payload: {
      opacity: opacity ? Number(opacity) : 0.5,
      velocityInPxsPerSecond: velocity ? Number(velocity) : 1.45,
      backgroundImageUrl: imageUrl ? await resolveImage(imageUrl) : undefined,
    },
  };
}

async function resolveImage(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();
    const base64String = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64String}`;
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to load image from URL: ${imageUrl}. Error: ${error}`
    );
    return undefined;
  }
}
