import * as rect from "../../utils/rect";
import { loadImage } from "../loadImage";
import shaderCode from "./assets/cursor-trail.wgsl";
import gradientUrl from "./assets/gradient.jpg";
import { AnimationBase } from "./base";

export type CursorTrailBuffers = {
  timeBuffer: GPUBuffer;
  progressBuffer: GPUBuffer;
  sourceBuffer: GPUBuffer;
  targetBuffer: GPUBuffer;
  canvasBuffer: GPUBuffer;
};

export class CursorTrail extends AnimationBase {
  private buffers?: CursorTrailBuffers;
  private pipeline?: GPURenderPipeline;
  private bindGroup?: GPUBindGroup;
  private bindGroupLayout?: GPUBindGroupLayout;

  private time = 0;
  private progress = 0;
  private duration = 0;
  private source?: DOMRect;
  private target?: DOMRect;

  async build() {
    await this.createBuffers();
    await this.createBindGroupLayout();
    await this.createBindGroup();
    await this.createPipeline();
  }

  render(time: number, clear: boolean) {
    const nextCursor = this.update(time);
    if (nextCursor) {
      this.draw(clear);
    } else {
      this.clear();
    }
  }

  private update(time: number) {
    const deltaTime = time - this.time;
    this.time = time;

    const nextCursor = this.vscode.editor.findSuitableCursorRect();

    if (nextCursor && !rect.equal(this.target, nextCursor)) {
      if (this.source) {
        this.source = rect.lerp(this.progress, this.source, this.target!);
      } else {
        this.source = this.target;
      }

      this.target = nextCursor;

      if (this.source) {
        this.duration =
          rect.distance(this.source, this.target) /
          this.config.velocityInPxsPerSecond;
        this.progress = 0;
      } else {
        this.progress = 1;
      }
    }

    if (this.progress < 1) {
      this.progress += deltaTime / this.duration;
      if (this.progress > 1) {
        this.progress = 1;
      }
    }

    return nextCursor;
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

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline!);
    passEncoder.setBindGroup(0, this.bindGroup!);
    passEncoder.draw(4);
    passEncoder.end();

    this.gpu.device.queue.submit([commandEncoder.finish()]);
  }

  private async updateBuffers() {
    const { x, y, width, height } = this.gpu.canvas.getBoundingClientRect();
    this.gpu.device.queue.writeBuffer(
      this.buffers!.canvasBuffer,
      0,
      new Float32Array([x, y, width, height])
    );
    this.gpu.device.queue.writeBuffer(
      this.buffers!.timeBuffer,
      0,
      new Float32Array([this.time])
    );
    this.gpu.device.queue.writeBuffer(
      this.buffers!.progressBuffer,
      0,
      new Float32Array([this.progress])
    );
    this.gpu.device.queue.writeBuffer(
      this.buffers!.sourceBuffer,
      0,
      new Float32Array([
        this.source!.left,
        this.source!.top,
        this.source!.right,
        this.source!.bottom,
      ])
    );
    this.gpu.device.queue.writeBuffer(
      this.buffers!.targetBuffer,
      0,
      new Float32Array([
        this.target!.left,
        this.target!.top,
        this.target!.right,
        this.target!.bottom,
      ])
    );
  }

  private async createBuffers() {
    this.buffers = {
      timeBuffer: this.gpu.device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      progressBuffer: this.gpu.device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      sourceBuffer: this.gpu.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      targetBuffer: this.gpu.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      canvasBuffer: this.gpu.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
    };
  }

  private async createBindGroupLayout() {
    this.bindGroupLayout = this.gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 6,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });
  }

  private async createBindGroup() {
    const texture = await loadImage(
      this.gpu.device,
      this.config.backgroundImageUrl ?? gradientUrl
    );

    const sampler = this.gpu.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    this.bindGroup = this.gpu.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffers!.timeBuffer },
        },

        {
          binding: 1,
          resource: { buffer: this.buffers!.progressBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.buffers!.sourceBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.buffers!.targetBuffer },
        },
        {
          binding: 4,
          resource: { buffer: this.buffers!.canvasBuffer },
        },
        {
          binding: 5,
          resource: texture.createView(),
        },
        {
          binding: 6,
          resource: sampler,
        },
      ],
    });
  }

  private async createPipeline() {
    const shaderModule = this.gpu.device.createShaderModule({
      code: shaderCode.replace("/*{opacity}*/", this.config.opacity.toFixed(2)),
    });

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
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
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
