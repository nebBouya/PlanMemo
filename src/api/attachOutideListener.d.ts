export interface OutsideListenerOptions {
    listenBlur?: boolean;
}

export function attachOutsideListener(
    wrapper: HTMLElement,
    isOpen: () => boolean,
    callback: (e: Event) => void,
    options?: OutsideListenerOptions
): () => void;