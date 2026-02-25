import h from "../api/h.js";
import { effect } from "../api/signals.js";
import { bindSettingToSignal } from "./effectTools.js";


export function createVerticalSlider({
    min = 0,
    max = 100,
    step,
    initialValue = min,
    valueSignal,
    storageKey,
    isFloating = false,
    onChange = () => { },
} = {}) {
    const input = h("input", {
        type: "range",
        min,
        max,
        value: initialValue,
        class: "vertical-slider__input",
        step: step ?? null,
        onInput(e) {
            const val = Number(e.target.value);
            if (valueSignal) valueSignal(val);
            else onChange(val);
        }
    });
    const slider = h("div", { class: "vertical-slider" }, input);

    const wrapper = isFloating
        ? h("div", { class: "vertical-slider__floating-wrapper" }, slider)
        : slider;
    if (valueSignal && storageKey) {
        bindSettingToSignal(storageKey, valueSignal, onChange);
        effect(() => {
            const val = valueSignal();
            if (input.value !== String(val)) input.value = val;
        });
    }

    const getValue = () => Number(input.value);
    const setValue = (val) => {
        input.value = val;
        if (valueSignal) valueSignal(val);
        else onChange(val);
    };

    return { get el() { return wrapper; }, getValue, setValue };
}
