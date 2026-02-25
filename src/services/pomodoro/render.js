import h from "../../api/h.js";
import { effect } from "../../api/signals.js";
import createDropdown from "../dropdown.js";
import { pomodoroBackground, pomodoroBackgroundSound, pomodoroTaskSelection, pomodoroTimer, promodoroAbmbientSoundLevel, STORE_KEYS } from "./store.js";
import { enterFullscreen, exitFullscreen } from "../fullscreen.js"
import safeAsync from "../../api/safeAsync.js"
import { getFilteredTasks } from "../../db/tables/tasks/services.js";
import { toast } from "../../api/toast.js";
import { renderBackground, onUserInteraction } from "./components/background.js";
import { renderTimeControls } from "./components/time.js";
import { renderProgressCard } from "./components/progress.js";
import { renderActions } from "./components/controls.js";
import { createVerticalSlider } from "../useVerticalSlider.js";


export function renderPomodoroTimer(openSettings = () => { }, openGallery = () => { }) {
    const { sessionPlan, skipBreaks: skipBreaksSignal, isRunning, isPaused } = pomodoroTimer.state;

    const slider = createVerticalSlider({
        isFloating: true,
        valueSignal: promodoroAbmbientSoundLevel,
        storageKey: STORE_KEYS.ambientSoundLevel,
        step: 12.5
    });

    const backgroundWrapper = h("div", { class: "pomodoro-screen__background" });

    effect(() => {
        backgroundWrapper.innerHTML = "";
        backgroundWrapper.appendChild(renderBackground(pomodoroBackground()));
    });

    const taskDropdown = createDropdown({
        options: [],
        placeholder: "Choisir une tâche"
    });

    const fullScreenIcon = h("i", { class: "button__icon icon icon--maximize", "aria-hidden": "true" });
    let isFullscreen = false;

    const header = h("header", { class: "pomodoro-screen__header" },
        h("section", { class: "form-field form-field__full-width form-field--transparent" },
            h("div", { class: "form-field__header" },
                h("label", { for: "task-choice" }, "Sélectionnez une tâche pour le minuteur"),
                h("p", { class: "form-field__description" }, "Vous pouvez démarrer le minuteur sans tâche, ou en choisir une à suivre.")
            ),
            taskDropdown.el
        )
    )

    const upperControlSection = h("div", { class: "pomodoro-screen__floating-controls pomodoro-screen__floating-exit" },
        h("button", {
            class: "floating-button pomodoro__button--global button button--icon button--transparent",
            type: "button",
            "aria-label": "Fermer le panneau",
            onClick: close
        }, h("i", { class: "button__icon icon icon--close", "aria-hidden": "true" }))
    )

    function initTaskSection() {
        const { today, unshedualed } = pomodoroTaskSelection();
        const active = isRunning() || isPaused();
        header.classList.toggle("visually-hidden", active || !(today || unshedualed));
        taskDropdown.reset();
        safeAsync(async () => {
            const data = await getFilteredTasks({ includeToday: today, includeUndated: unshedualed });
            taskDropdown.update(data.map(task => ({
                value: task.id,
                content: task.title,
                label: task.title
            })))
        }, () => toast.error("failed to load tasks"))();
    }

    effect(() => initTaskSection());

    const galleryModalButton = h("button", {
        class: "floating-button pomodoro__button--global button button--icon button--transparent",
        type: "button",
        "aria-label": "Ouvrir la galerie",
        onClick: openGallery
    }, h("i", { class: "button__icon icon icon--gallery", "aria-hidden": "true" }));
    const settingModalButton = h("button", {
        class: "floating-button pomodoro__button--global button button--icon button--transparent",
        type: "button",
        "aria-label": "Ouvrir les paramètres",
        onClick: openSettings
    }, h("i", { class: "button__icon icon icon--settings", "aria-hidden": "true" }));

    const breaksInfoText = h("p",
        { class: "breaks-info__text" }
        , "");

    const skipBreakInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        checked: skipBreaksSignal(),
        onChange(e) {
            pomodoroTimer.setSkipBreaks(e.target.checked);
        }
    });
    const breakControlSection = h("div", { class: "pomodoro-screen__breaks-info" },
        breaksInfoText,
        h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent" },
            h("label", { class: "checkbox__label" },
                h("span", { class: "checkbox__text" }, "Désactiver les pauses"),
                skipBreakInput
            )
        )
    );

    const timeControlComponent = renderTimeControls();
    const progressCardComponent = renderProgressCard(initTaskSection);
    const actionsComponent = renderActions({
        getTaskId: () => taskDropdown.getValue(),
        openPip: close
    });

    effect(() => {
        const running = isRunning();
        const paused = isPaused();
        const active = running || paused;
        progressCardComponent.classList.toggle("visually-hidden", !active);
        header.classList.toggle("visually-hidden", active);
        breakControlSection.classList.toggle("visually-hidden", active);
        upperControlSection.classList.toggle("visually-hidden", active);
        settingModalButton.classList.toggle("visually-hidden", active);
        galleryModalButton.classList.toggle("visually-hidden", active);
    });

    effect(() => {
        const running = isRunning();
        const paused = isPaused();
        const src = pomodoroBackgroundSound();
        const active = (running || paused) && src && src !== "remove";
        slider.el.classList.toggle("visually-hidden", !active);
    });


    effect(() => {
        const skip = skipBreaksSignal();
        const breaks = sessionPlan().filter(s => s.type === "break");
        const totalBreaks = breaks.length;

        breaksInfoText.innerHTML = skip
            ? "Les pauses sont désactivées pour cette session."
            : `Vous aurez <strong>${totalBreaks} pause${totalBreaks > 1 ? "s" : ""}</strong> durant cette session.`;

        skipBreakInput.checked = skip;
    });

    const timer = h("section", {
        class: "pomodoro-screen visually-hidden",
        role: "dialog",
        "aria-modal": "true"
    }, backgroundWrapper,
        h("div", { class: "pomodoro-screen__card" },
            header,
            timeControlComponent,
            breakControlSection,
            actionsComponent
        ),
        upperControlSection,
        h("div", { class: "pomodoro-screen__floating-controls" },
            galleryModalButton, settingModalButton,
            h("button", {
                class: "floating-button pomodoro__button--global button button--icon button--transparent",
                type: "button",
                "aria-label": "Maximiser",
                onClick() {
                    isFullscreen = !isFullscreen;
                    if (isFullscreen) {
                        enterFullscreen(timer);
                    } else {
                        exitFullscreen();
                    }
                    fullScreenIcon.classList.replace(
                        isFullscreen ? "icon--maximize" : "icon--minimize",
                        isFullscreen ? "icon--minimize" : "icon--maximize"
                    );
                }


            }, fullScreenIcon), progressCardComponent
        ), slider.el);
    document.body.append(timer);

    function close() {
        exitFullscreen();
        timer.classList.add("visually-hidden");
        document.body.style.overflow = "";
    }

    function open() {
        timer.classList.remove("visually-hidden");
        document.body.style.overflow = "hidden";
        initTaskSection();
    }

    pomodoroTimer.safeInit();

    return {
        get el() {
            return timer;
        },
        open,
        close,
        onUserInteraction
    };
}
