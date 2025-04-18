export interface IBridge {
  connect(): Promise<void>;

  sendMessage<T extends BridgeMessageType>(
    type: T,
    payload: BridgeMessage<T>
  ): void;

  onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      payload: BridgeMessage<T>,
      reply: <U extends BridgeMessageType>(
        type: U,
        message: BridgeMessage<U>
      ) => void
    ) => void
  ): void;

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

export const ANIMATION_NAMES = [
  "cursor-transition",
  "cursor-trail",
  "smoke",
] as const;
export type AnimationName = (typeof ANIMATION_NAMES)[number];
export type AnimationConfiguration = {
  animations: AnimationName[];
  cursorTransition: {
    velocity: number;
    opacity: number;
    bloom: number;
    backgroundImageUrl?: string;
  };
  smoke: {
    opacity: number;
  };
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
