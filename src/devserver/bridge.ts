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
      animations: ["firework"],
      cursorTransition: {
        opacity: 0.7,
        velocity: 0.65,
        bloom: 0,
      },
      smoke: {
        opacity: 0.65,
      },
    } as AnimationConfiguration as BridgeMessage<T>;
  }
}
