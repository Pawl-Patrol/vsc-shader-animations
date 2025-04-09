import { AnimationConfiguration } from "../../common/types";
import fragmentShaderCode from "./assets/fragment.wgsl";
import vertexShaderCode from "./assets/vertex.wgsl";

export async function createPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  bindGroupLayout: GPUBindGroupLayout,
  config: AnimationConfiguration
) {
  const shaderModule = (code: string) => device.createShaderModule({ code });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  // Ensure blending is enabled in the pipeline
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule(vertexShaderCode),
      entryPoint: "main",
    },
    fragment: {
      module: shaderModule(
        fragmentShaderCode.replace("/*{opacity}*/", config.opacity.toFixed(2))
      ),
      entryPoint: "main",
      targets: [
        {
          format,
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

  return pipeline;
}
