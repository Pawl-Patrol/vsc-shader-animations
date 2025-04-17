import { BridgeMessage, BridgeMessageType, IBridge } from "../lib/types";

export class Bridge implements IBridge {
  async connect() {}

  sendMessage<T extends BridgeMessageType>(
    type: T,
    message: BridgeMessage<T>
  ) {}

  async onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      message: BridgeMessage<T>
    ) => void
  ) {}

  async waitForMessage<T extends BridgeMessageType>(type: T) {
    return {
      opacity: 0.5,
      velocityInPxsPerSecond: 0.65,
      wigglyWorm: false,
    } as BridgeMessage<T>;
  }
}
