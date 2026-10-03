export interface LampModeOptions {
  /** Which top corner the cord hangs from. Default `'right'`. */
  position?: 'left' | 'right';
  /** Any CSS color. Default: inherit the page's text color (or `--lm-color`). */
  color?: string;
}

export interface LampModeInstance {
  /** Flip the theme programmatically (plays the pull animation). */
  toggle(): void;
  /** The `<button>` element. */
  el: HTMLButtonElement;
}

export interface LampModeStatic {
  /** Mount the cord. Returns `null` when there is no DOM (SSR). */
  init(options?: LampModeOptions): LampModeInstance | null;
}

declare const LampMode: LampModeStatic;
export default LampMode;
export const init: LampModeStatic['init'];
