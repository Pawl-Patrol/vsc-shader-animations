import { AnimationConfiguration } from "../../common/types";
import gradientUrl from "./assets/gradient.jpg";

export async function createBindGroup(
  device: GPUDevice,
  config: AnimationConfiguration
) {
  const timeBuffer = device.createBuffer({
    size: 8,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const progressBuffer = device.createBuffer({
    size: 8,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const sourceBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const targetBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const canvasBuffer = device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const texture = await loadImage(
    device,
    config.backgroundImageUrl ?? gradientUrl
  );

  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });

  const bindGroupLayout = device.createBindGroupLayout({
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

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: timeBuffer },
      },

      {
        binding: 1,
        resource: { buffer: progressBuffer },
      },
      {
        binding: 2,
        resource: { buffer: sourceBuffer },
      },
      {
        binding: 3,
        resource: { buffer: targetBuffer },
      },
      {
        binding: 4,
        resource: { buffer: canvasBuffer },
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

  return {
    timeBuffer,
    progressBuffer,
    sourceBuffer,
    targetBuffer,
    canvasBuffer,
    bindGroupLayout,
    bindGroup,
  };
}

async function loadImage(device: GPUDevice, url: string) {
  const response = await fetch(url);
  const imageBitmap = await createImageBitmap(await response.blob());

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture: texture },
    [imageBitmap.width, imageBitmap.height]
  );

  return texture;
}
