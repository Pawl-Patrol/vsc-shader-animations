export type AnimationConfiguration = {
  velocityInPxsPerSecond: number;
  backgroundImageUrl?: string;
};

type BridgeMessageBase<
  TFrom extends "extension" | "script",
  TType extends string,
  TPayload extends object
> = {
  from: TFrom;
  type: TType;
  payload: TPayload;
};

export type AnimationConfigurationRequest = BridgeMessageBase<
  "script",
  "config",
  {}
>;

export type AnimationConfigurationResponse = BridgeMessageBase<
  "extension",
  "config",
  AnimationConfiguration
>;

export type BridgeMessage =
  | AnimationConfigurationRequest
  | AnimationConfigurationResponse;
