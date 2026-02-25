import h from "../../../api/h.js";
import { effect } from "../../../api/signals.js";
import { pomodoroTimer } from "../store.js";


export function renderTimeControls() {
    const { isRunning, currentTime, workingTime, canDecrease, canIncrease, isPaused } = pomodoroTimer.state;

    const decBtn = h("button", {
        class: "floating-button pomodoro__button--global time-controls__button button button--icon button--transparent",
        type: "button",
        "aria-label": "Réduire le temps de travail",
        onClick: () => pomodoroTimer.decrementWorkingTime(),
        onLongClick: () => pomodoroTimer.decrementWorkingTime(),
    }, h("i", { class: "button__icon icon icon--remove", "aria-hidden": "true" }));

    const incBtn = h("button", {
        class: "floating-button pomodoro__button--global time-controls__button button button--icon button--transparent",
        type: "button",
        "aria-label": "Augmenter le temps de travail",
        onClick: () => pomodoroTimer.incrementWorkingTime(),
        onLongClick: () => pomodoroTimer.incrementWorkingTime(),
    }, h("i", { class: "button__icon icon icon--add", "aria-hidden": "true" }));

    const startTimeCounter = h("span", {}, "0");
    const idleCounter = h("span", { class: "time-controls__value", "aria-live": "polite" },
        startTimeCounter, h("span", {}, "min")
    );

    const minutesSpan = h("span");
    const secondsSpan = h("span");
    const activeCounter = h("span", {
        class: "time-controls__value time-controls__value--playing",
        "aria-live": "polite"
    }, minutesSpan, h("span", {}, ":"), secondsSpan);

    const content = [];
    const wrapper = h("div", { class: "pomodoro-screen__time-controls" });

    effect(() => {
        const minutes = Math.floor(workingTime() / 60);
        startTimeCounter.textContent = minutes.toString();
        decBtn.disabled = !canDecrease();
        incBtn.disabled = !canIncrease();
    });

    effect(() => {
        const time = currentTime();
        const isValid = typeof time === "number" && !isNaN(time);
        const min = isValid ? Math.floor(time / 60).toString().padStart(2, "0") : "00";
        const sec = isValid ? (time % 60).toString().padStart(2, "0") : "00";
        minutesSpan.textContent = min;
        secondsSpan.textContent = sec;
    });

    effect(() => {
        const running = isRunning();
        const paused = isPaused();
        const active = running || paused;
        content.length = 0;
        content.push(...(active ? [activeCounter] : [decBtn, idleCounter, incBtn]));
        wrapper.innerHTML = "";
        wrapper.append(...content);
    });

    wrapper.append(...content);
    return wrapper;
}