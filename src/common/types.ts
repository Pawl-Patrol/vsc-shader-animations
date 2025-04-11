export type AnimationConfiguration = {
  opacity: number;
  velocityInPxsPerSecond: number;
  backgroundImageUrl?: string;
};

type BridgeMessageBase<TType extends string, TPayload extends object> = {
  type: TType;
  payload: TPayload;
};

export type AnimationConfigurationRequest = BridgeMessageBase<
  "config-request",
  {}
>;

export type AnimationConfigurationResponse = BridgeMessageBase<
  "config-response",
  AnimationConfiguration
>;

export type BridgeMessage =
  | AnimationConfigurationRequest
  | AnimationConfigurationResponse;
