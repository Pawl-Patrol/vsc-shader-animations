import { AnimationConfiguration } from "../../types";

export function loadShader(
  device: GPUDevice,
  shaderCode: string,
  config: AnimationConfiguration
) {
  return device.createShaderModule({
    code: shaderCode.replace(
      /\${(.*?)}/g,
      (str, key) => getNestedValue(config, key) ?? str
    ),
  });
}

function getNestedValue(
  config: AnimationConfiguration,
  path: string
): string | null {
  const result = path.split(".").reduce(
    (acc, key) => {
      if (typeof acc === "object" && key in acc) {
        return acc[key];
      }
      return undefined;
    },
    { config } as any
  );
  return result !== undefined ? String(result) : null;
}
