import h from "../../api/h.js";
import { effect } from "../../api/signals.js";
import { getIcon, splitDate } from "../tokens.js";
import { getTaskListSignal, dashTaskType, setTaskListSignal } from "./store.js";
import { formFieldValidate } from "../form-field.js";
import safeAsync from "../../api/safeAsync.js";
import { addTask } from "../../db/tables/tasks/services.js";
import { toast } from "../../api/toast.js"
import { currentUser } from "../../main/init.js";

function createTaskCard(task) {
    return h("li", { class: "task" },
        h("span", {
            class: `group-color group-color--rod group-color--sm group-color--${task.group ? task.group.color : "df-pres"}`,
            "aria-hidden": "true"
        }),
        h("section", { class: "task-group" },
            h("p", { class: "task__title" }, task.title),
            h("span", { class: "task__group" },
                ...(task.group ? [h("span", { class: "group__type" },
                    h("i", { class: getIcon(task.group.icon), "aria-hidden": "true" }),
                    task.group.label
                )] : [])
            )
        )
    )
}

function createTaskSlot(tasks = [], type = "") {
    return h("fragement", {},
        h("h3", { id: "upcoming-title", class: "upcoming__title" }, type === "today" ? "À venir" : "Tâches à faire"),
        h("ul", { class: "upcoming__tasks" },
            ...tasks.map(createTaskCard)
        )
    )
}

function emptyTaskSot() {
    return h("fragment", {},
        h("p", { class: "upcoming__empty", id: "upcoming-empty" },
            h("i", { class: `upcoming__empty--icon ${getIcon("info")}`, "aria-hidden": "true" }),
            "Votre planning est vide. Ajoutez une tâche pour rester productif(ve) !"
        )
    )
}

function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bonjour";
    if (hour >= 12 && hour < 18) return "Bon après-midi";
    if (hour >= 18 && hour < 22) return "Bonsoir";
    return "Bonne nuit";
}

function createHeader(count, type) {
    let message = "";

    switch (type) {
        default:
        case "none":
            message = "Aucune tâche à afficher pour le moment.";
            break;
        case "today":
            message = `Vous avez ${count} tâche${count > 1 ? "s" : ""} pour aujourd’hui.`;
            break;
        case "unscheduled":
            message = `Aucune tâche prévue aujourd’hui, voici ${count} tâche${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""} à traiter.`;
            break;
    }

    const heading = h("h2", { id: "greeting-title", class: "card--greeting__title" });

    effect(() => {
        const { firstName } = currentUser();
        heading.innerHTML = `${getTimeBasedGreeting()}, ${firstName}`;
    })

    return h("fragment", {},
        heading,
        h("p", { class: "greeting__desc" }, message)
    );
}


export function renderGreeting() {
    const header = document.getElementById("greeting__header");
    const slot = document.getElementById("greeting__slot");
    effect(() => {
        const data = getTaskListSignal();
        const type = dashTaskType();
        header.innerHTML = "";
        slot.innerHTML = "";
        if (data.length === 0) {
            header.appendChild(createHeader(0, "none"));
            slot.appendChild(emptyTaskSot());
            slot.classList.add("empty__state");
        } else {
            const previewTasks = data.slice(0, 2);
            header.appendChild(createHeader(data.length, type));
            slot.appendChild(createTaskSlot(previewTasks, type));
            slot.classList.remove("empty__state");
        }
    });
}

const dueDatePresets = {
    now: {
        label: "Maintenant",
        getDate: () => splitDate(new Date()),
    },
    tomorrow: {
        label: "Demain",
        getDate: () => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return splitDate(d);
        },
    },
    in3Days: {
        label: "Dans 3 jours",
        getDate: () => {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            return splitDate(d);
        },
    },
    thisWeek: {
        label: "Cette semaine",
        getDate: () => {
            const d = new Date();
            const daysUntilSunday = 7 - d.getDay();
            d.setDate(d.getDate() + daysUntilSunday);
            return splitDate(d);
        },
    },
    nextWeek: {
        label: "La semaine prochaine",
        getDate: () => {
            const d = new Date();
            const daysUntilNextMonday = ((8 - d.getDay()) % 7) || 7;
            d.setDate(d.getDate() + daysUntilNextMonday);
            return splitDate(d);
        },
    },
    thisMonth: {
        label: "Ce mois-ci",
        getDate: () => {
            const d = new Date();
            return splitDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        },
    },
    none: {
        label: "Sans échéance",
        getDate: () => null,
    },
};

export function renderQuickTask() {
    const datePresets = Object.keys(dueDatePresets);
    const form = document.getElementById("quick-task__form");
    const formButton = form.querySelector(".input__button");
    const formValidator = formFieldValidate(form);
    const datePicker = document.getElementById("quick-task__date");
    datePicker.innerHTML = "";
    datePicker.append(h("section", { class: "form-field form-field__full-width" },
        h("div", { class: "form-field__header" },
            h("p", { class: "form-field__description", id: "dueDatePreset-desc" }, "Choisissez l'horaire de la tâche rapide.")
        ),
        h("div", {
            class: "radio-grid button-grid",
            "aria-label": "Choisir l'horaire de la tâche",
            "aria-describedby": "dueDatePreset-desc",
        }, ...datePresets.map(preset => h("label", { class: "radio-choice button-choice" },
            h("input", {
                type: "radio",
                name: "dueDatePreset",
                value: preset,
                checked: preset === "now"
            }),
            h("span", { class: "radio-choice__visual visual--button button button--compact button--neutral" },
                h("span", { class: "button__content" },
                    h("span", { class: "button__group" },
                        h("i", { class: `button__icon--left ${getIcon("clock")}`, "aria-hidden": "true" }),
                        h("span", { class: "button__label" }, dueDatePresets[preset].label)
                    )
                )
            )
        ))),
    ));
    function reset() {
        formValidator.reset();
        formValidator.formInput.value = "";
        datePicker.querySelectorAll("input").forEach(input => {
            input.checked = (input.value === "now");
        });
    }
    const addNewTask = safeAsync(async () => {
        const dueDate = datePicker.querySelector("input[name='dueDatePreset']:checked")?.value || "none";
        if (!formValidator.isValid()) return;
        const task = await addTask({
            title: formValidator.formInput.value.trim(),
            dueDate: dueDatePresets[dueDate].getDate(),
            groupId: null,
            noteId: null,
            subtasks: [],
            status: dueDate === "now" ? "in_progress" : "unfinished"
        });
        if (dueDate === "now") {
            setTaskListSignal([...setTaskListSignal(), task]);
        }
        toast.success("Tâche créée avec succès.");
        reset();
    }, () => {
        toast.error("Erreur lors de la création de la tâche.");
    });
    formButton.addEventListener("click", addNewTask);
    return reset;
}
