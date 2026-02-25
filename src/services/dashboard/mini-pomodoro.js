import h from "../../api/h.js";
import { effect, computed } from "../../api/signals.js";
import { pomodoroTimer } from "../pomodoro/store.js";

export function renderMiniPomodoro(expandTimer) {
    const { isRunning, currentTime, workingTime, canDecrease, canIncrease, isPaused, isBreak, iteration, awaitingManualFinish } = pomodoroTimer.state;
    const hasStarted = computed(() => iteration() > 0);
    const expandBtn = h("button", {
        class: "pomodoro__button--global button button--compact button--icon visually-hidden",
        type: "button",
        onClick: expandTimer
    },
        h("i", { class: "button__icon icon icon--maximize" })
    );
    const mainButtonIcon = h("i", {
        class: "button__icon--left icon icon--play",
        ariaHidden: "true"
    });
    const mainButton = h("button", {
        class: "button button--compact button--custom",
        type: "button",
        ariaLabel: "Lancer le minuteur"
    },
        h("span", { class: "button__content" },
            h("span", { class: "button__group" },
                mainButtonIcon,
                h("span", { class: "button__label" }, "Lancer")
            )
        )
    );
    const cancelButton = h("button", {
        class: "button button--compact button--custom-outline",
        type: "button",
        "aria-label": "Annuler le minuteur",
        onclick: () => {
            pomodoroTimer.cancel();
        },
    },
        h("span", { class: "button__content" },
            h("span", { class: "button__label" }, "Annuler")
        )
    );
    const decBtn = h("button", {
        class: "timer__control--button button button--icon button--compact button--custom",
        type: "button",
        ariaLabel: "Retirer 5 minute",
        onClick: () => pomodoroTimer.decrementWorkingTime(),
        onLongClick: () => pomodoroTimer.decrementWorkingTime(),
    },
        h("i", {
            class: "button__icon icon icon--remove",
            ariaHidden: "true"
        })
    )
    const incBtn = h("button", {
        class: "timer__control--button button button--icon button--compact button--custom",
        type: "button",
        ariaLabel: "Ajouter 5 minute",
        onClick: () => pomodoroTimer.incrementWorkingTime(),
        onLongClick: () => pomodoroTimer.incrementWorkingTime(),
    },
        h("i", {
            class: "button__icon icon icon--add",
            ariaHidden: "true"
        })
    );
    const startTimeCounter = h("li", {
        id: "timer-display",
        "data-idle": 0
    }, "240");
    const counterWrapper = h("ul", {
        class: "timer__duration",
        ariaLive: "polite",
        ariaAtomic: "true"
    });
    const minutes = h("li", { class: "unit" });
    const seconds = h("li", { class: "unit" });
    const sperator = h("li", { class: "unit" }, ":");
    effect(() => {
        const running = isRunning();
        const paused = isPaused();
        const started = hasStarted();
        const active = running || paused;
        const manFinish = awaitingManualFinish();
        counterWrapper.innerHTML = "";
        counterWrapper.append(...(active ?
            [minutes, sperator, seconds] :
            [startTimeCounter,
                h("li", { class: "unit" }, "min")]));
        expandBtn.classList.toggle("visually-hidden", !active);
        cancelButton.classList.toggle("visually-hidden", !active);
        mainButtonIcon.classList.toggle("visually-hidden", active);
        incBtn.classList.toggle("visually-hidden", active);
        decBtn.classList.toggle("visually-hidden", active);
        mainButton.onclick = null;
        if (!started) {
            mainButton.onclick = () => pomodoroTimer.start();
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
    });
    effect(() => {
        const time = currentTime();
        const isValid = typeof time === "number" && !isNaN(time);
        const min = isValid ? Math.floor(time / 60).toString().padStart(2, "0") : "00";
        const sec = isValid ? (time % 60).toString().padStart(2, "0") : "00";
        minutes.textContent = min;
        seconds.textContent = sec;
    });
    effect(() => {
        const minutes = Math.floor(workingTime() / 60);
        startTimeCounter.setAttribute("data-idle", minutes.toString());
        startTimeCounter.textContent = minutes.toString();
        decBtn.disabled = !canDecrease();
        incBtn.disabled = !canIncrease();
    });
    const heading = h("h2", { class: "mini-pomodoro__title" }, "Concentration");
    effect(() => {
        const is_break = isBreak();
        heading.innerText = is_break ? "Pause" : "Concentration";
    });
    const wrapper = h("section", { class: "mini-pomodoro__content" },
        h("header", { class: "mini-pomodoro__header" },
            heading,
            expandBtn
        ),
        h("section", {
            class: "mini-pomodoro__timer",
            ariaLabel: "Contrôles du minuteur"
        },
            h("section", { class: "timer__control" },
                decBtn,
                counterWrapper,
                incBtn
            ),
            h("section", { class: "timer_actions" },
                mainButton,
                cancelButton
            )
        )
    );

    return wrapper;
}