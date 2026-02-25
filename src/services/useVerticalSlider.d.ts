import type { Signal } from "../api/signals";

export interface CreateVerticalSliderOptions {
    min?: number;
    max?: number;
    step?: number;
    initialValue?: number;
    valueSignal?: Signal<number>;
    storageKey?: string;
    onChange?: (val: number) => void;
    isFloating?: boolean;
}

export interface CreateVerticalSliderReturn {
    readonly el: HTMLElement;
    getValue: () => number;
    setValue: (val: number) => void;
}

export function createVerticalSlider(
    options?: CreateVerticalSliderOptions
): CreateVerticalSliderReturn;
