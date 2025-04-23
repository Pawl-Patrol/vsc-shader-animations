import * as rect from "../../utils/rect";
import shaderCode from "./assets/firework.wgsl";
import { AnimationBase } from "./base";
import { loadShader } from "./loadShader";

const MAX_NUMBER_OF_EXPLOSIONS = 64;

export class Firework extends AnimationBase {
  private uniformBuffer?: GPUBuffer;
  private explosionsBuffer?: GPUBuffer;
  private pipeline?: GPURenderPipeline;
  private bindGroup?: GPUBindGroup;
  private bindGroupLayout?: GPUBindGroupLayout;

  private time = 0;
  private lastCursor: DOMRect | undefined;
  private explosions = new Float32Array(4 * MAX_NUMBER_OF_EXPLOSIONS);
  private explosionsCount = 0;

  async build() {
    this.createBuffers();
    this.createBindGroupLayout();
    this.createBindGroup();
    this.createPipelines();
  }

  render(time: number, clear: boolean) {
    this.update(time);
    this.draw(clear);
  }

  private update(time: number) {
    this.time = time;
    const cursor = this.vscode.editor.findSuitableCursorRect();
    if (cursor && !rect.equal(cursor, this.lastCursor)) {
      this.lastCursor = cursor;
      const { x, y, width, height } = this.gpu.canvas.getBoundingClientRect();
      this.explosions.set(
        [cursor.right - x, (cursor.top + cursor.bottom) / 2 - y, time * 0.001],
        this.explosionsCount * 4
      );
      this.explosionsCount =
        (this.explosionsCount + 1) % MAX_NUMBER_OF_EXPLOSIONS;
    }
  }

  private draw(clear: boolean) {
    this.updateBuffers();

    const commandEncoder = this.gpu.device.createCommandEncoder();

    const textureView = this.gpu.context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadOp: clear ? "clear" : "load",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        },
      ],
    };
    const imagePass = commandEncoder.beginRenderPass(renderPassDescriptor);
    imagePass.setPipeline(this.pipeline!);
    imagePass.setBindGroup(0, this.bindGroup!);
    imagePass.draw(4);
    imagePass.end();

    this.gpu.device.queue.submit([commandEncoder.finish()]);
  }

  private async updateBuffers() {
    const { width, height } = this.gpu.canvas.getBoundingClientRect();
    this.gpu.device.queue.writeBuffer(
      this.uniformBuffer!,
      0,
      new Float32Array([width, height, width / height, this.time * 0.001])
    );
    this.gpu.device.queue.writeBuffer(
      this.explosionsBuffer!,
      0,
      this.explosions.buffer
    );
  }

  private async createBuffers() {
    this.uniformBuffer = this.gpu.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.explosionsBuffer = this.gpu.device.createBuffer({
      size: 16 * MAX_NUMBER_OF_EXPLOSIONS,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createBindGroupLayout() {
    this.bindGroupLayout = this.gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
  }

  private createBindGroup() {
    this.bindGroup = this.gpu.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer! },
        },
        {
          binding: 1,
          resource: { buffer: this.explosionsBuffer! },
        },
      ],
    });
  }

  private createPipelines() {
    const shaderModule = loadShader(this.gpu.device, shaderCode, this.config);

    this.pipeline = this.gpu.device.createRenderPipeline({
      layout: this.gpu.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout!],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vertex_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [
          {
            format: this.gpu.format,
            blend: {
              color: {
                srcFactor: "one",
                dstFactor: "one",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
      },
    });
  }
}
