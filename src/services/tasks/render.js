import { effect } from "../../api/signals.js";
import { getIcon, normalizeDate, splitDate, truncateText } from "../tokens.js";
import h from "../../api/h.js";
import { createUpdateTaskDialog } from "./create.js";
import { isNullable, isType } from "../../utils/general.js";
import { createReadNoteDialog } from "../notes/create.js";
import safeAsync from "../../api/safeAsync.js";
import { updateSubtask, updateTask } from "../../db/tables/tasks/services.js";
import { toast } from "../../api/toast.js";
import { getCurrentTaskGroup } from "../groups/store.js";
import { dashTaskType } from "../dashboard/store.js";

function isAcceptableStatus(status) {
    return status === "unfinished" || status === "in_progress";
}

function handleTaskCheckboxChange(task, isChecked, externalStore) {
    safeAsync(async () => {
        const updates = { status: null };

        if (isChecked) {
            updates.status = "done";
        } else {
            if (task.dueDate) {
                const due = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                due.setHours(0, 0, 0, 0);

                if (due < today) {
                    const newDue = new Date();
                    updates.dueDate = splitDate(newDue);
                    updates.status = "in_progress";
                } else if (due.getTime() === today.getTime()) {
                    updates.status = "in_progress";
                } else {
                    updates.status = "unfinished";
                }
            } else {
                updates.status = "unfinished";
            }
        }
        if (isType(task.subtasks, "array")) {
            updates.subtasks = task.subtasks.map(sub => ({
                ...sub,
                checked: isChecked
            }));
        }
        const updatedTask = await updateTask(task.id, updates);
        externalStore.forEach(store => store(store().map(t => t.id === task.id ? updatedTask : t)));
    }, () => toast.error("Erreur lors de la mise à jour de la tâche principale."))();
}


function createTaskSlot(title, key, tasks, externalInstances, externalStore) {
    const { currentDashType: dashType } = externalInstances;
    return h("section", {
        class: "layout__slot task-slot",
        "data-slot-type": key,
        ...(key === "date" && tasks.length > 0 ? { "data-date": normalizeDate(tasks[0].dueDate) } : {})
    },
        h("h2", { class: `layout__slot--title task-slot__title${dashType ? " heading__title" : ""}` },
            dashType ? (dashType === "today" ? "Les tâches d’aujourd’hui" : "Les tâches non planifiées") : title
        ),
        h("ul", { class: "task-list" }, ...tasks.map(task => createTaskCard(task, externalInstances, externalStore)))
    );
}

function createTaskCard(task, externalInstances, externalStore) {
    let expanded = false;
    const icon = h("i", {
        class: `button__icon ${getIcon("chevron-down")}`,
        "aria-hidden": "true"
    });
    const { currentGroup: externalGroup, currentDashType: dashType } = externalInstances;
    const subTaskCounter = h("span", { class: "subtask-indicator" }, `${task.subtasks.filter(s => s.checked).length}/${task.subtasks.length}`);
    const expandableList = h("section", { class: "task-item__sub-group visually-hidden" },
        ...((!isNullable(task.note) && isAcceptableStatus(task.status)) ? [h("section", { class: `task-note-preview note-color--${task.note.color}` },
            h("header", { class: "task-note-preview__header" },
                h("h3", { class: "task-note-preview__title" }, `Note liée : ${task.note.title}`),
                h("button", {
                    class: "task-note-preview__button button button--icon button--transparent",
                    "aria-label": "Voir la note complète",
                    onClick: () => createReadNoteDialog(task.noteId)
                }, h("i", { class: getIcon("expand"), "aria-hidden": "true" })),
            ),
            h("article", { class: "task-note-preview__content" }, truncateText(task.note.content)),
        )] : []),
        ...((task.subtasks?.length > 0 && isAcceptableStatus(task.status)) ? [h("ul", { class: "subtask-list" },
            ...task.subtasks.map((sub, i) =>
                h("li", { class: "subtask" },
                    h("fieldset", { class: "checkbox checkbox--sm" },
                        h("label", { class: "checkbox__label", for: `${externalGroup ? "group-" : ""}subtask-${task.id}-${i}` },
                            h("input", {
                                id: `${externalGroup ? "group-" : ""}subtask-${task.id}-${i}`,
                                type: "checkbox",
                                class: "checkbox__input",
                                checked: sub.checked || undefined,
                                onChange: (e) => safeAsync(async () => {
                                    const isChecked = e.currentTarget.checked;
                                    const updated = await updateSubtask(task.id, i, isChecked);
                                    subTaskCounter.innerHTML = `${updated.subtasks.filter(s => s.checked).length}/${updated.subtasks.length}`;
                                    if (updated.status === "done") {
                                        externalStore.forEach(store => store(store().map(t => t.id === task.id ? updated : t)));
                                    }
                                }, () => toast.error("Erreur lors de la mise à jour de la sous-tâche."))(),
                            }),
                            h("span", { class: "checkbox__custom", "aria-hidden": "true" }),
                            h("span", { class: "checkbox__text" }, sub.text)
                        )
                    )
                )
            )
        )] : []));

    const expandBtn = h("button", {
        class: "button button--icon button--compact visually-hidden",
        type: "button",
        onClick() {
            expanded = !expanded;
            expandableList.classList.toggle("visually-hidden", !expanded);

            if (expanded) {
                icon.classList.remove("icon--chevron-down");
                icon.classList.add("icon--chevron-up");
            } else {
                icon.classList.remove("icon--chevron-up");
                icon.classList.add("icon--chevron-down");
            }
        }
    }, icon);

    if ((task.subtasks?.length > 0 || !isNullable(task.note)) && isAcceptableStatus(task.status)) {
        expandBtn.classList.remove("visually-hidden");
    }
    return h("li", { class: `task-item task--${dashType ? "unfinished" : task.status}` },
        h("article", { class: "task-item__group" },
            h("section", { class: "task-item__group--input" },
                h("fieldset", { class: "checkbox" },
                    h("label", { class: "checkbox__label", for: `task-${task.id}` },
                        h("input", {
                            id: `${externalGroup ? "group-" : ""}task-${task.id}`,
                            type: "checkbox",
                            class: "checkbox__input",
                            checked: task.status === "done" || task.status === "temp_finished" || undefined,
                            onChange: (e) => handleTaskCheckboxChange(task, e.currentTarget.checked, externalStore)
                        }),
                        h("span", { class: "checkbox__custom", "aria-hidden": "true" })
                    )
                ),
                h("section", { class: "task-item__group-name" },
                    h("p", { class: "task-item__title" }, task.title),
                    h("div", { class: "task-item__group-tags" },
                        ...(task.group && !externalGroup ? [
                            h("span", { class: "badge badge--group" },
                                h("span", {
                                    class: `group-color group-color--bullet group-color--md group-color--${task.group.color}`,
                                    "aria-hidden": "true"
                                }),
                                task.group.label
                            )
                        ] : []),
                        ...(task.noteId ? [
                            h("span", { class: "badge badge--note", title: "Liée à une note" },
                                h("i", { class: getIcon("notes"), "aria-hidden": "true" })
                            )
                        ] : []),
                        ...(task.subtasks?.length ? [
                            subTaskCounter
                        ] : [])
                    )
                )
            ),
            h("section", { class: "task-item__meta" },
                h("div", { class: "task-item__actions" },
                    h("button", {
                        class: `button button--icon button--compact${isAcceptableStatus(task.status) ? "" : " visually-hidden"}`,
                        type: "button",
                        "aria-label": "Modifier la tâche",
                        onClick: () => {
                            if (!isAcceptableStatus(task.status)) return;
                            createUpdateTaskDialog(task.id, externalGroup ? "group" : "normal", externalStore)
                        },
                    }, h("i", { class: `button__icon ${getIcon("edit")}`, "aria-hidden": "true" })),
                    expandBtn
                )
            )
        ),
        expandableList,
    );
}

function createEmptyTaskState() {
    return h("section", { class: "layout-empty-state task-empty-state" },
        h("span", { class: "layout-empty-state__icon task-empty-state__icon", "aria-hidden": "true" },
            h("i", { class: getIcon("info") })
        ),
        h("h2", { class: "layout-empty-state__title task-empty-state__title" }, "Aucune tâche trouvée"),
        h("p", { class: "layout-empty-state__description task-empty-state__description" }, "Ajoutez votre première tâche pour commencer à organiser votre travail.")
    );
}

export function renderTasks(container, dataSignal, mode = "normal", externalStore = []) {
    if (!container) return;
    const statement = {
        getter: null,
        setter: null
    }
    if(isType(dataSignal, "array")) {
        statement.getter = dataSignal[0];
        statement.setter = dataSignal[1];
    } else {
        statement.getter = dataSignal;
        statement.setter = dataSignal;
    }
    externalStore.push(statement.setter);
    safeAsync(async () => {
        const externalInstances = {
            currentGroup: null,
            currentDashType: null
        };
        effect(async () => {
            const tasks = statement.getter();
            container.innerHTML = "";
            externalInstances.currentGroup = null;
            externalInstances.currentDashType = null;

            if (mode === "group") {
                externalInstances.currentGroup = await getCurrentTaskGroup();
            } else if (mode === "dashboard") {
                externalInstances.currentDashType = dashTaskType();
            }

            if (tasks.length === 0) {
                container.appendChild(createEmptyTaskState());
                return;
            }

            const activeDated = [];
            const undatedActive = [];
            const finished = [];

            for (const task of tasks) {
                if (["done", "temp_finished"].includes(task.status)) {
                    finished.push(task);
                } else if (!task.dueDate) {
                    undatedActive.push(task);
                } else {
                    activeDated.push(task);
                }
            }

            activeDated.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            const groupedByDate = {};
            for (const task of activeDated) {
                const dateKey = normalizeDate(task.dueDate);
                if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
                groupedByDate[dateKey].push(task);
            }

            const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));
            for (const date of sortedDates) {
                container.appendChild(createTaskSlot(date === normalizeDate(new Date()) ? "Aujourd'hui" : date, "date", groupedByDate[date], externalInstances, externalStore));
            }

            if (undatedActive.length > 0) {
                container.appendChild(createTaskSlot("Tâches sans date", "no-date", undatedActive, externalInstances, externalStore));
            }

            if (finished.length > 0) {
                container.appendChild(createTaskSlot("Tâches terminées", "finished", finished, externalInstances, externalStore));
            }
        });
    })();
}