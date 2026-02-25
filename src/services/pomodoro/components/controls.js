import h from "../../../api/h.js";
import { computed, effect } from "../../../api/signals.js";
import { pomodoroTimer } from "../store.js";

export function renderActions({ openPip = () => { }, getTaskId = () => { } } = {}) {
    const { isRunning, isPaused, iteration, awaitingManualFinish } = pomodoroTimer.state;
    const hasStarted = computed(() => iteration() > 0);

    const mainButton = h(
        "button",
        {
            class: "floating-button pomodoro__button--global button button--transparent",
            type: "button",
            "aria-label": "Démarrer le minuteur",
        },
        h("span", { class: "button__label" }, "Démarrer")
    );

    const cancelButton = h(
        "button",
        {
            class: "floating-button pomodoro__button--global button button--transparent",
            type: "button",
            "aria-label": "Annuler le minuteur",
            onclick: () => {
                pomodoroTimer.cancel();
            },
        },
        h("span", { class: "button__label" }, "Annuler")
    );

    const resetSettingsButton = h(
        "button",
        {
            class: "floating-button pomodoro__button--global button button--icon button--transparent",
            type: "button",
            "aria-label": "Réinitialiser le minuteur",
            onclick: () => {
                pomodoroTimer.setWorkingTime(3600);
                pomodoroTimer.setSkipBreaks(false);
            },
        },
        h("i", { class: "button__icon icon icon--update", "aria-hidden": "true" })
    );
    const pipButton = h(
        "button",
        {
            class: "floating-button pomodoro__button--global button button--icon button--transparent",
            type: "button",
            "aria-label": "Activer le mode mini (PIP)",
            onclick: () => openPip(),
        },
        h("i", { class: "button__icon icon icon--to-pip", "aria-hidden": "true" })
    );

    const container = h("div", { class: "pomodoro-screen__actions" });

    effect(() => {
        const started = hasStarted();
        const running = isRunning();
        const paused = isPaused();
        const manFinish = awaitingManualFinish();
        mainButton.onclick = null;
        if (!started) {
            mainButton.onclick = () => pomodoroTimer.start(getTaskId());
            mainButton.setAttribute("aria-label", "Démarrer le minuteur");
            mainButton.querySelector(".button__label").textContent = "Démarrer";
        } else if (paused && manFinish) {
            mainButton.onclick = () => pomodoroTimer.finishManually();
            mainButton.setAttribute("aria-label", "Marquer la tâche comme terminée");
            mainButton.querySelector(".button__label").textContent = "Marquer comme terminée";
        } else if (paused) {
            mainButton.onclick = () => pomodoroTimer.resume();
            mainButton.setAttribute("aria-label", "Reprendre le minuteur");
            mainButton.querySelector(".button__label").textContent = "Reprendre";
        } else if (running) {
            mainButton.onclick = () => pomodoroTimer.pause();
            mainButton.setAttribute("aria-label", "Mettre en pause le minuteur");
            mainButton.querySelector(".button__label").textContent = "Pause";
        }
        container.innerHTML = "";
        container.append(mainButton);
        if (started || paused) {
            container.append(cancelButton, pipButton);
        }
        container.append(resetSettingsButton);
        resetSettingsButton.classList.toggle("visually-hidden", started);
    });

    return container;
}
