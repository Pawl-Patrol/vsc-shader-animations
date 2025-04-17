import {
  AnimationConfiguration,
  BridgeMessage,
  BridgeMessageType,
  IBridge,
} from "../lib/types";

export class Bridge implements IBridge {
  async connect() {}

  sendMessage<T extends BridgeMessageType>(
    type: T,
    message: BridgeMessage<T>
  ) {}

  async onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      message: BridgeMessage<T>,
      reply: <U extends BridgeMessageType>(
        type: U,
        payload: BridgeMessage<U>
      ) => void
    ) => void
  ) {}

  async waitForMessage<T extends BridgeMessageType>(type: T) {
    return {
      velocityInPxsPerSecond: 0.65,
      wigglyWorm: true,
      shaderOptions: {
        cursorTrailOpacity: 0.65,
      },
    } as AnimationConfiguration as BridgeMessage<T>;
  }
}
