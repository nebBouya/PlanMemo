import { createSettingsModal, createGalleryModal } from "./create.js";
import { renderPomodoroTimer } from "./render.js";
import { initStore } from "./store.js";

export function initPomodoro() {
    initStore();
    let _settingsModelTriggerInstance = null;
    let _galleryModelTriggerInstance = null;
    function openSettings() {
        _settingsModelTriggerInstance?.();
    }
    function openGallery() {
        _galleryModelTriggerInstance?.();
    }
    const timer = renderPomodoroTimer(openSettings, openGallery);
    _settingsModelTriggerInstance = createSettingsModal(timer.el);
    _galleryModelTriggerInstance = createGalleryModal(timer.el);
    return () => {
        timer.onUserInteraction();
        timer.open();
    };
}