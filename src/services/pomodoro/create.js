import h from "../../api/h.js";
import createDropdown from "../dropdown.js";
import createModal from "../modal.js";
import { FOCUS_DURATIONS, BREAK_DURATIONS, BACKGROUND_SOUND_ICONS, FOCUS_SOUNDS, BREAK_SOUNDS, pomodoroBackground, BACKGROUND_IMAGES, BACKGROUND_GRADIENTS, BACKGROUND_VIDEOS, fullPomodoroSettings, pomodoroBackgroundSound, SAMPLE_DURATION, pomodoroSettings, pomodoroTaskSelection } from "./store.js";
import soundPlayer from "../../api/playSound.js";
import { getImagePath } from "../getPublicPath.js";
import { getIcon } from "../tokens.js";
import { toast } from "../../api/toast.js";


export function createSettingsModal(timer) {
    const closest = ".overlay-modal__nav";
    const breakDropdown = createDropdown({ placeholder: "Choisir une durée", options: BREAK_DURATIONS, showRemoveBtn: false, closest });

    const breakDropdownSection = h("section", { class: "pomodoro-modal__content" },
        h("section", { class: "form-field form-field__full-width form-field--transparent" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Durée de la pause"),
                h("p", { class: "form-field__description" }, "Ajustez la durée de votre période de pause")
            ),
            breakDropdown.el
        )
    );
    const autoInfo = h("p", {
        class: "form-field__info visually-hidden",
        style: {
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--color-primary-02)",
            lineHeight: "1.3"
        }
    }, "En mode automatique, le minuteur ajuste intelligemment les périodes de concentration et de pause pour correspondre au temps de travail total défini.");

    function handleBreakWhenAuto(preset) {
        const isAuto = preset === "auto";
        breakDropdownSection.classList.toggle("visually-hidden", isAuto);
        autoInfo.classList.toggle("visually-hidden", !isAuto);
    }

    const focusDropdown = createDropdown({
        placeholder: "Choisir une durée", options: FOCUS_DURATIONS, showRemoveBtn: false, closest, onChange: handleBreakWhenAuto
    });
    const focusSoundDropdown = createDropdown({
        placeholder: "Choisir un son",
        options: FOCUS_SOUNDS.map((src, i) => ({
            value: src,
            content: `Son ${i + 1}`,
            label: `Son de concentration ${i + 1}`
        })),
        onChange: value => soundPlayer.playSampleSmart({ src: value, duration: SAMPLE_DURATION.notification }),
        showRemoveBtn: false,
        closest
    });

    const breakSoundDropdown = createDropdown({
        placeholder: "Choisir un son",
        options: BREAK_SOUNDS.map((src, i) => ({
            value: src,
            content: `Son ${i + 1}`,
            label: `Son de pause ${i + 1}`
        })),
        onChange: value => soundPlayer.playSampleSmart({ src: value, duration: SAMPLE_DURATION.notification }),
        showRemoveBtn: false,
        closest
    });


    let focusSoundSection = null;
    const focusSoundToggleInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        checked: true,
        onChange(event) {
            focusSoundSection?.classList.toggle("visually-hidden", !event.target.checked);
        }
    });
    focusSoundSection = h("section", { class: "pomodoro-modal__content" },
        h("section", { class: "form-field form-field__full-width form-field--transparent" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Son de fin de session"),
                h("p", { class: "form-field__description" }, "Jouer un son à la fin de la période de concentration")
            ),
            focusSoundDropdown.el
        )
    );
    let breakSoundSection = null;
    const breakSoundToggleInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        checked: true,
        onChange(event) {
            breakSoundSection?.classList.toggle("visually-hidden", !event.target.checked);
        }
    });

    breakSoundSection = h("section", { class: "pomodoro-modal__content" },
        h("section", { class: "form-field form-field__full-width form-field--transparent" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Son de fin de pause"),
                h("p", { class: "form-field__description" }, "Jouer un son à la fin de la période de pause")
            ),
            breakSoundDropdown.el
        )
    )
    const backgroundSound = pomodoroBackgroundSound();
    const customSoundRadios = Object.entries(BACKGROUND_SOUND_ICONS).map(([icon, sound]) =>
        h("label", { class: "radio-choice radio-choice--neutral" },
            h("input", {
                type: "radio",
                name: "custom-sound",
                value: icon,
                checked: backgroundSound === icon,
                onChange() {
                    if (icon == "remove") soundPlayer.clearSamples();
                    else soundPlayer.playSampleSmart({ src: sound, duration: SAMPLE_DURATION.background });
                }
            }),
            h("span", { class: "radio-choice__visual" },
                h("i", { class: getIcon(icon), "aria-hidden": "true" })
            )
        )
    );

    function onTaskSelectionChange() {
        autoFinishSection.classList.toggle("visually-hidden", !(taskTodayInput.checked || taskUnschedualedInput.checked));
    }

    const taskTodayInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        "aria-label": "Inclure les tâches prévues pour aujourd’hui dans la liste Pomodoro",
        onChange: onTaskSelectionChange
    })

    const taskUnschedualedInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        "aria-label": "Inclure les tâches actives sans date dans la liste Pomodoro",
        onChange: onTaskSelectionChange
    })

    const autoFinishTaskInput = h("input", {
        type: "checkbox",
        class: "checkbox__input",
        "aria-label": "Activer la fin automatique de la tâche à la fin de la session de concentration"
    })

    const autoFinishSection = h("section", { class: "pomodoro-modal__content" },
        h("section", { class: "form-field form-field__full-width form-field--transparent" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Fin automatique de la tâche"),
                h("p", { class: "form-field__description" },
                    "Lorsque cette option est activée, la tâche en cours sera automatiquement marquée comme terminée à la fin du minuteur de concentration."
                )
            ),
            h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent" },
                h("label", { class: "checkbox__label" },
                    h("span", { class: "checkbox__text" }, "Auto-finir"),
                    autoFinishTaskInput
                )
            )
        )
    )

    const content = h("nav", { class: "overlay-modal__nav" },
        h("section", { class: "pomodoro-modal__content" },
            h("div", { class: "form-field form-field__full-width form-field--transparent" },
                h("div", { class: "form-field__header" },
                    h("label", {}, "Son personnalisé"),
                    h("p", { class: "form-field__description" }, "Jouer un son de fond pendant la session de concentration")
                ),
                h("div", { class: "radio-grid" }, ...customSoundRadios)
            )
        ),
        h("section", { class: "pomodoro-modal__content" },
            h("section", { class: "form-field form-field__full-width form-field--transparent" },
                h("div", { class: "form-field__header" },
                    h("label", {}, "Durée de concentration"),
                    h("p", { class: "form-field__description" }, "Ajustez la durée de votre période de concentration"),
                    autoInfo
                ),
                focusDropdown.el
            )
        ),
        breakDropdownSection,
        h("section", { class: "pomodoro-modal__content" },
            h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent", style: { width: "100%" } },
                h("label", { class: "checkbox__label" },
                    h("span", { class: "checkbox__text" }, "Activer le son de fin de session"),
                    focusSoundToggleInput
                )
            )
        ),
        focusSoundSection,
        h("section", { class: "pomodoro-modal__content" },
            h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent", style: { width: "100%" } },
                h("label", { class: "checkbox__label" },
                    h("span", { class: "checkbox__text" }, "Activer le son de fin de pause"),
                    breakSoundToggleInput
                )
            )
        ),
        breakSoundSection,
        h("section", { class: "pomodoro-modal__content" },
            h("section", { class: "form-field form-field__full-width form-field--transparent" },
                h("div", { class: "form-field__header" },
                    h("label", {}, "Tâches à inclure dans la sélection Pomodoro"),
                    h("p", { class: "form-field__description" },
                        "Choisissez les types de tâches à afficher dans la liste de sélection. "
                        + "Si aucune option n’est sélectionnée, la liste ne sera pas affichée."
                    )
                ),
                h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent" },
                    h("label", { class: "checkbox__label" },
                        h("span", { class: "checkbox__text" }, "Tâches du jour"),
                        taskTodayInput
                    )
                ),
                h("br", {}),
                h("fieldset", { class: "checkbox checkbox--switch checkbox--transparent" },
                    h("label", { class: "checkbox__label" },
                        h("span", { class: "checkbox__text" }, "Tâches sans date"),
                        taskUnschedualedInput
                    )
                )
            )
        ),
        autoFinishSection,
        h("section", { class: "pomodoro-modal__content" }, h("button", {
            class: "pomodoro__button--global button button--transparent button--full",
            type: "button",
            "aria-label": "Enregistrer les paramètres",
            onClick() {
                const newSettings = {
                    focusDuration: focusDropdown.getValue(),
                    breakDuration: breakDropdown.getValue(),
                    focusSoundEnabled: focusSoundToggleInput.checked,
                    breakSoundEnabled: breakSoundToggleInput.checked,
                    focusSound: focusSoundDropdown.getValue(),
                    breakSound: breakSoundDropdown.getValue()
                };
                const newSound = document.querySelector("input[name='custom-sound']:checked")?.value || "remove";
                const taskSettings = {
                    today: taskTodayInput.checked,
                    unshedualed: taskUnschedualedInput.checked,
                    autoFinishTask: autoFinishTaskInput.checked,
                };
                if (!taskSettings.today && !taskSettings.unshedualed) taskSettings.autoFinishTask = false;
                pomodoroSettings(newSettings);
                pomodoroBackgroundSound(newSound);
                pomodoroTaskSelection(taskSettings)
                toast.success("Paramètres enregistrés avec succès !");
                modal.close();
            }
        }, h("span", { class: "button__label" }, "Enregistrer les paramètres")))
    );

    function reset() {
        const {
            focusDuration,
            breakDuration,
            focusSound,
            breakSound,
            focusSoundEnabled,
            breakSoundEnabled,
            backgroundSound,
            taskSelection
        } = fullPomodoroSettings();
        focusDropdown.setValue(focusDuration, true);
        breakDropdown.setValue(breakDuration, true);
        handleBreakWhenAuto(focusDuration);
        focusSoundDropdown.setValue(focusSound, true);
        breakSoundDropdown.setValue(breakSound, true);
        focusSoundToggleInput.checked = focusSoundEnabled;
        breakSoundToggleInput.checked = breakSoundEnabled;
        taskTodayInput.checked = taskSelection.today;
        taskUnschedualedInput.checked = taskSelection.unshedualed;
        autoFinishTaskInput.checked = taskSelection.autoFinishTask;
        focusSoundSection?.classList.toggle("visually-hidden", !focusSoundEnabled);
        breakSoundSection?.classList.toggle("visually-hidden", !breakSoundEnabled);
        autoFinishSection.classList.toggle("visually-hidden", !(taskSelection.today || taskSelection.unshedualed));
        const radioToCheck = content.querySelector(`input[name='custom-sound'][value='${backgroundSound}']`);
        if (radioToCheck) radioToCheck.checked = true;
    }

    const modal = createModal({
        title: "Paramètres du Minuteur Pomodoro",
        content,
        isPomodoro: true,
        onClose() {
            reset();
            soundPlayer.clearSamples();
        },
        portal: timer
    });

    return () => {
        reset();
        modal.open();
    };
}

export function createGalleryModal(timer) {
    const { value: selected } = pomodoroBackground();
    const BACKGROUND_OPTIONS = [
        {
            type: "image",
            label: "Images statiques",
            description: "Choisissez un arrière-plan fixe pour le minuteur.",
            values: BACKGROUND_IMAGES,
            render: (value) => h("img", {
                src: getImagePath(`pomodoro/thumbnail/${value}.jpg`),
                alt: "Static Image"
            })
        },
        {
            type: "gradient",
            label: "Dégradés animés",
            description: "Choisissez un dégradé animé pour un effet relaxant.",
            values: BACKGROUND_GRADIENTS,
            render: (value) => h("span", {
                class: `radio-choice__visual group-color pomodoro-gradient-sample--${value}`
            })
        },
        {
            type: "video",
            label: "Vidéos en boucle",
            description: "Choisissez une vidéo d’ambiance pour votre minuteur.",
            values: BACKGROUND_VIDEOS,
            render: (value) => h("img", {
                src: getImagePath(`pomodoro/thumbnail/${value}.jpg`),
                alt: "Animated Video Background"
            })
        }
    ];

    const content = h("nav", { class: "overlay-modal__nav" },
        ...BACKGROUND_OPTIONS.map(section =>
            h("section", { class: "pomodoro-modal__content" },
                h("div", { class: "form-field form-field__full-width form-field--transparent" },
                    h("div", { class: "form-field__header" },
                        h("label", {}, section.label),
                        h("p", { class: "form-field__description" }, section.description)
                    ),
                    h("div", { class: "radio-grid radio-grid--pomodoro" },
                        ...section.values.map(value => {
                            const input = h("input", {
                                type: "radio",
                                name: "pomodoro-bg",
                                value,
                                checked: selected === value,
                                "data-content-type": section.type,
                                onChange() {
                                    const newBackground = {
                                        value,
                                        type: section.type
                                    };
                                    pomodoroBackground(newBackground);
                                    modal.close();
                                }
                            });
                            return h("label", { class: "radio-choice radio-choice--pomodoro" },
                                input,
                                h("span", { class: "radio-choice__visual" }, section.render(value))
                            );
                        })
                    )
                )
            )
        )
    );

    const modal = createModal({
        title: "Arrière-plan du minuteur Pomodoro",
        content,
        isPomodoro: true,
        portal: timer
    });

    return () => {
        const { value, type } = pomodoroBackground();
        document
            .querySelectorAll('input[name="pomodoro-bg"]')
            .forEach(input => {
                const inputType = input.dataset.contentType;
                input.checked = input.value === value && inputType === type;
            });
        modal.open();
    }
}