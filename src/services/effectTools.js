import storage from "../storage/local-storage.js";
import { effect } from "../api/signals.js";

export function syncThemeDependentImages(theme) {
    const isDark = theme === "dark";
    document.querySelectorAll("img[data-theme-img][data-theme-img-dark]").forEach(img => {
        const lightSrc = img.getAttribute("data-theme-img");
        const darkSrc = img.getAttribute("data-theme-img-dark");
        img.src = isDark ? darkSrc : lightSrc;
    });
}


export function bindSettingToSignal(key, keySignal, onChange = () => { }) {
    const defaultValue = keySignal();
    storage.initKey(key, { default: defaultValue });

    const value = storage.read(key, null);
    if (value !== null) keySignal(value);

    effect(() => {
        const newVal = keySignal();
        storage.write(key, newVal);
        onChange?.(newVal);
    });
}
