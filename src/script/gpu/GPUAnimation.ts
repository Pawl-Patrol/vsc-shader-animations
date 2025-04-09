import { AnimationConfiguration } from "../../common/types";
import { createBindGroup } from "./bindGroup";
import { initWebGPU } from "./init";
import { createPipeline } from "./pipeline";

export class GPUAnimation {
  constructor(
    private canvas: HTMLCanvasElement,
    private device: GPUDevice,
    private context: GPUCanvasContext,
    private pipeline: GPURenderPipeline,
    private timeBuffer: GPUBuffer,
    private progressBuffer: GPUBuffer,
    private sourceBuffer: GPUBuffer,
    private targetBuffer: GPUBuffer,
    private canvasBuffer: GPUBuffer,
    private bindGroup: GPUBindGroup
  ) {
    this.onCanvasResize();
    new ResizeObserver(this.onCanvasResize.bind(this)).observe(this.canvas);
  }

  public static async create(
    canvas: HTMLCanvasElement,
    config: AnimationConfiguration
  ) {
    const { device, context, format } = await initWebGPU(canvas);

    const {
      timeBuffer,
      progressBuffer,
      sourceBuffer,
      targetBuffer,
      canvasBuffer,
      bindGroupLayout,
      bindGroup,
    } = await createBindGroup(device, config);
    const pipeline = await createPipeline(
      device,
      format,
      bindGroupLayout,
      config
    );

    return new GPUAnimation(
      canvas,
      device,
      context,
      pipeline,
      timeBuffer,
      progressBuffer,
      sourceBuffer,
      targetBuffer,
      canvasBuffer,
      bindGroup
    );
  }

  onCanvasResize() {
    const { x, y, width, height } = this.canvas.getBoundingClientRect();
    const canvasRect = new Float32Array([x, y, width, height]);
    this.device.queue.writeBuffer(this.canvasBuffer, 0, canvasRect);
  }

  clear() {
    const ctx = this.context.getCurrentTexture();
    const commandEncoder = this.device.createCommandEncoder();
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
    this.device.queue.submit([commandEncoder.finish()]);
  }

  render(source: DOMRect, target: DOMRect, time: number, progress: number) {
    this.device.queue.writeBuffer(this.timeBuffer, 0, new Float32Array([time]));

    this.device.queue.writeBuffer(
      this.progressBuffer,
      0,
      new Float32Array([progress])
    );

    const rect1 = new Float32Array([
      source.left,
      source.top,
      source.right,
      source.bottom,
    ]);
    const rect2 = new Float32Array([
      target.left,
      target.top,
      target.right,
      target.bottom,
    ]);
    this.device.queue.writeBuffer(this.sourceBuffer, 0, rect1);
    this.device.queue.writeBuffer(this.targetBuffer, 0, rect2);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadOp: "load",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.draw(4); // Use 6 vertices to draw the polygon
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
