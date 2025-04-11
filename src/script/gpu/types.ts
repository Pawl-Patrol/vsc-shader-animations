import { Bridge } from "../vscode/bridge";
import { Editor } from "../vscode/editor";

export type GPUContext = {
  device: GPUDevice;
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
};

export type VscodeContext = {
  bridge: Bridge;
  editor: Editor;
};
