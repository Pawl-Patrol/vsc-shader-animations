import * as vscode from "vscode";
import { AnimationConfiguration, AnimationName } from "../lib/types";

export async function getConfig(): Promise<AnimationConfiguration> {
  const config = vscode.workspace.getConfiguration("vsc-cursor-animations");
  return {
    animations: config.get<AnimationName[]>("animations", []),
    cursorTrail: {
      velocity: config.get<number>("cursorTrail.velocity", 0.5),
      opacity: config.get<number>("cursorTrail.opacity", 0.5),
      backgroundImageUrl: config.get<string>("cursorTrail.backgroundImageUrl"),
      bloom: config.get<number>("cursorTrail.bloom", 1),
    },
    smoke: {
      opacity: config.get<number>("smoke.opacity", 0.5),
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
