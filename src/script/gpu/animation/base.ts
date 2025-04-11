import { AnimationConfiguration } from "../../../common/types";
import { GPUContext, VscodeContext } from "../types";

export abstract class AnimationBase {
  constructor(
    protected gpu: GPUContext,
    protected vscode: VscodeContext,
    protected config: AnimationConfiguration
  ) {}

  abstract build(): Promise<void>;
  abstract render(time: number): void;

  public clear() {
    const ctx = this.gpu.context.getCurrentTexture();
    const commandEncoder = this.gpu.device.createCommandEncoder();
    const textureView = ctx.createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          clearValue: [0, 0, 0, 0],
          storeOp: "store",
        },
      ],
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.end();
    this.gpu.device.queue.submit([commandEncoder.finish()]);
  }
}
