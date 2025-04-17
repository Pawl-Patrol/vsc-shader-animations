import { AnimationConfiguration } from "../../types";

export function loadShader(
  device: GPUDevice,
  shaderCode: string,
  config: AnimationConfiguration
) {
  return device.createShaderModule({
    code: shaderCode.replace(
      /\${(.*?)}/g,
      (_, key: keyof typeof config.shaderOptions) =>
        String(config.shaderOptions?.[key] ?? "")
    ),
  });
}
