import shaderCode from "./assets/smoke.wgsl";
import { AnimationBase } from "./base";
import { loadShader } from "./loadShader";

export class Smoke extends AnimationBase {
  private uniformBuffer?: GPUBuffer;
  private pipeline?: GPURenderPipeline;
  private bindGroup?: GPUBindGroup;
  private bindGroupLayout?: GPUBindGroupLayout;

  private time = 0;

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
      new Float32Array([width, height, width / height, this.time])
    );
  }

  private async createBuffers() {
    this.uniformBuffer = this.gpu.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private createBindGroupLayout() {
    this.bindGroupLayout = this.gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
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
