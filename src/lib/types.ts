export interface IBridge {
  connect(): Promise<void>;

  sendMessage<T extends BridgeMessageType>(
    type: T,
    message: BridgeMessage<T>
  ): void;

  onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      message: BridgeMessage<T>
    ) => void
  ): Promise<void>;

  waitForMessage<T extends BridgeMessageType>(
    type: T
  ): Promise<BridgeMessage<T>>;
}

export interface IEditor {
  canvas: HTMLCanvasElement;
  connect(): Promise<void>;
  findSuitableCursorRect(): DOMRect | null;
}

export type VscodeContext = {
  bridge: IBridge;
  editor: IEditor;
};

export type AnimationConfiguration = {
  opacity: number;
  velocityInPxsPerSecond: number;
  backgroundImageUrl?: string;
  wigglyWorm: boolean;
};

type BridgeMessages = {
  "config-request": undefined;
  "config-response": AnimationConfiguration;
  hyperspace: undefined;
};

export type BridgeMessageType = keyof BridgeMessages;
export type BridgeMessage<
  TName extends keyof BridgeMessages = keyof BridgeMessages
> = BridgeMessages[TName];
