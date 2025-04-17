import shaderCode from "./assets/hyperspace.wgsl";
import { AnimationBase } from "./base";

export type HyperspaceBuffers = {
  uniformBuffer: GPUBuffer;
};

export class Hyperspace extends AnimationBase {
  private buffers?: HyperspaceBuffers;
  private pipeline?: GPURenderPipeline;
  private bindGroup?: GPUBindGroup;
  private bindGroupLayout?: GPUBindGroupLayout;

  private time = 0;

  async build() {
    await this.createBuffers();
    await this.createBindGroupLayout();
    await this.createBindGroup();
    await this.createPipeline();
  }

  render(time: number, clear: boolean) {
    this.time = time;
    this.draw(clear);
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

    const commandBuffer = commandEncoder.finish();
    this.gpu.device.queue.submit([commandBuffer]);
  }

  private async updateBuffers() {
    const { width, height } = this.gpu.canvas.getBoundingClientRect();
    this.gpu.device.queue.writeBuffer(
      this.buffers!.uniformBuffer,
      0,
      new Float32Array([width, height, this.time / 1000])
    );
  }

  private async createBuffers() {
    this.buffers = {
      uniformBuffer: this.gpu.device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
    };
  }

  private async createBindGroupLayout() {
    this.bindGroupLayout = this.gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });
  }

  private async createBindGroup() {
    this.bindGroup = this.gpu.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffers!.uniformBuffer },
        },
      ],
    });
  }

  private async createPipeline() {
    const shaderModule = this.gpu.device.createShaderModule({
      code: shaderCode,
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
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
            writeMask: GPUColorWrite.ALL,
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
      },
    });
  }
}
