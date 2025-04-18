import shaderCode from "./assets/wiggly-worm.wgsl";
import { AnimationBase } from "./base";
import { loadShader } from "./loadShader";

export type CursorTrailBuffers = {
  uniformBuffer: GPUBuffer;
  pointsInputBuffer: GPUBuffer;
  pointsOutputBuffer: GPUBuffer;
};

export class CursorTrail extends AnimationBase {
  private buffers?: CursorTrailBuffers;
  private imagePipeline?: GPURenderPipeline;
  private pointsPipeline?: GPUComputePipeline;
  private bindGroupLayout?: GPUBindGroupLayout;

  private frame = 0;
  private time = 0;
  private cursor = { x: 0, y: 0 };

  async build() {
    await this.createBuffers();
    await this.createBindGroupLayout();
    await this.createPipelines();
  }

  render(time: number, clear: boolean) {
    this.update(time);
    this.draw(clear);
  }

  private update(time: number) {
    this.time = time;
    const nextCursor = this.vscode.editor.findSuitableCursorRect();
    const { x, y } = this.gpu.canvas.getBoundingClientRect();
    if (nextCursor) {
      this.cursor = {
        x: nextCursor.right - x,
        y: (nextCursor.top + nextCursor.bottom) / 2 - y,
      };
    }
  }

  private draw(clear: boolean) {
    this.updateBuffers();

    const commandEncoder = this.gpu.device.createCommandEncoder();

    const bindGroup = this.getBindGroup();

    const pointsPass = commandEncoder.beginComputePass();
    pointsPass.setPipeline(this.pointsPipeline!);
    pointsPass.setBindGroup(0, bindGroup);
    pointsPass.dispatchWorkgroups(1);
    pointsPass.end();

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
    imagePass.setPipeline(this.imagePipeline!);
    imagePass.setBindGroup(0, bindGroup);
    imagePass.draw(4);
    imagePass.end();

    this.gpu.device.queue.submit([commandEncoder.finish()]);

    this.frame++;
  }

  private async updateBuffers() {
    const uniformArrayBuffer = new ArrayBuffer(
      this.buffers!.uniformBuffer.size
    );
    const floatView = new Float32Array(uniformArrayBuffer);
    const intView = new Int32Array(uniformArrayBuffer);

    const { width, height } = this.gpu.canvas.getBoundingClientRect();
    floatView[0] = width;
    floatView[1] = height;
    floatView[2] = width / height;

    floatView[4] = this.cursor.x;
    floatView[5] = this.cursor.y;
    floatView[6] = this.cursor.x;
    floatView[7] = this.cursor.y;

    floatView[8] = this.time / 1000;
    intView[9] = this.frame;

    this.gpu.device.queue.writeBuffer(
      this.buffers!.uniformBuffer,
      0,
      uniformArrayBuffer
    );
  }

  private async createBuffers() {
    this.buffers = {
      uniformBuffer: this.gpu.device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      }),
      pointsInputBuffer: this.gpu.device.createBuffer({
        size: 1024,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
      pointsOutputBuffer: this.gpu.device.createBuffer({
        size: 1024,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.COPY_DST,
      }),
    };
  }

  private async createBindGroupLayout() {
    this.bindGroupLayout = this.gpu.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
          buffer: { type: "storage" },
        },
      ],
    });
  }

  private getBindGroup() {
    const pointsInputBuffer =
      this.frame % 2 === 0
        ? this.buffers!.pointsOutputBuffer
        : this.buffers!.pointsInputBuffer;
    const pointsOutputBuffer =
      this.frame % 2 === 0
        ? this.buffers!.pointsInputBuffer
        : this.buffers!.pointsOutputBuffer;
    return this.gpu.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.buffers!.uniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: pointsInputBuffer },
        },
        {
          binding: 2,
          resource: { buffer: pointsOutputBuffer },
        },
      ],
    });
  }

  private async createPipelines() {
    const shaderModule = loadShader(this.gpu.device, shaderCode, this.config);

    const pipelineLayout = this.gpu.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout!],
    });

    this.pointsPipeline = this.gpu.device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: "points_compute_main",
      },
    });

    this.imagePipeline = this.gpu.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "image_vertex_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "image_fragment_main",
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
