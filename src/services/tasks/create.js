import h from "../../api/h.js";
import { addTask, getTaskById, updateTask, deleteTask } from "../../db/tables/tasks/services.js";
import { getAllNotes } from "../../db/tables/notes/services.js";
import { getAllGroups } from "../../db/tables/groups/services.js";
import { toast } from "../../api/toast.js";
import createDialog from "../dialog.js";
import createDropdown from "../dropdown.js";
import { formFieldValidate } from "../form-field.js";
import safeAsync from "../../api/safeAsync.js";
import { getCurrentDate, getIcon, splitDate, areArraysEqual } from "../tokens.js";
import { useCurrentTaskGroup } from "../groups/store.js";

function isSubtaskEqual(a, b) {
    return areArraysEqual(a, b, (s1, s2) =>
        s1.id === s2.id &&
        s1.title === s2.title &&
        s1.done === s2.done
    );
}

function createSubtaskListManager(initial = []) {
    const list = h("ul", { class: "subtask-form-list" });

    const addBtn = h("button", {
        type: "button",
        class: "button button--compact button--icon form-field__header--button",
        "aria-label": "Ajouter une sous-tâche",
        onClick: () => addSubtask(),
    }, h("i", { class: getIcon("add"), "aria-hidden": "true" }));

    const wrapper = h("section", { class: "form-field" },
        h("div", { class: "form-field__header header-flex" },
            h("div", { class: "field__header--group" },
                h("label", {}, "Sous-tâches"),
                h("p", { class: "form-field__description" },
                    "Ajoutez, modifiez ou supprimez des sous-tâches à cette tâche.")
            ),
            addBtn
        ),
        list
    );

    function createSubtaskItem(text = "", checked = false) {
        const checkbox = h("input", {
            type: "checkbox",
            class: "checkbox__input",
            checked: checked || undefined,
        });

        const textInput = h("input", {
            type: "text",
            class: "input__raw",
            placeholder: "Sous-tâche...",
            value: text,
        });

        const deleteBtn = h("button", {
            class: "button button--compact button--error-outline button--icon task_creator--button",
            type: "button",
            ariaLabel: "Supprimer la sous-tâche",
            onClick: () => list.removeChild(item),
        }, h("i", { class: getIcon("remove"), "aria-hidden": "true" }));

        const item = h("li", { class: "subtask-form-item" },
            h("fieldset", { class: "checkbox checkbox--sm task_creator" },
                h("label", { class: "checkbox__label task_creator--field" },
                    checkbox,
                    textInput
                ),
                deleteBtn
            )
        );

        return item;
    }

    function addSubtask(text = "", checked = false) {
        const item = createSubtaskItem(text, checked);
        list.prepend(item);
    }

    function getSubtasks() {
        return Array.from(list.children)
            .map(li => {
                const checkbox = li.querySelector("input[type='checkbox']");
                const input = li.querySelector("input[type='text']");
                return {
                    text: input.value.trim(),
                    checked: checkbox.checked
                };
            })
            .filter(s => s.text !== "");
    }

    initial.forEach(sub => addSubtask(sub.text, sub.checked));

    return {
        el: wrapper,
        addSubtask,
        getSubtasks,
        reset() {
            list.innerHTML = "";
        }
    };
}


export function createTaskDialog(mode = "normal", externalStore = []) {
    const titleInput = h("input", {
        id: "task-title",
        class: "input__field",
        type: "text",
        placeholder: "Titre de la tâche...",
        "aria-label": "Titre de la tâche",
    });

    const titleField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", { for: "task-title" }, "Titre de la tâche"),
            h("p", { class: "form-field__description" }, "Un titre court pour votre tâche.")
        ),
        h("label", { class: "input input--compact", for: "task-title" },
            h("span", { class: "input__content" },
                h("span", { class: "input__group" }, titleInput)
            )
        )
    );

    const dateInput = h("input", {
        class: "input__field",
        type: "date",
        min: getCurrentDate(),
        onclick() {
            this.min = getCurrentDate();
            this.showPicker?.();
        }
    });

    const dateField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", {}, "Date d'échéance"),
            h("p", { class: "form-field__description" }, "Date et heure optionnelles de la tâche.")
        ),
        h("label", { class: "input input--compact" },
            h("span", { class: "input__content" },
                h("span", { class: "input__group" },
                    h("span", {
                        class: "input__icon button button--icon button--compact button--transparent button--static",
                        role: "presentation",
                        "aria-hidden": "true"
                    }, h("i", { class: "button__icon icon icon--calendar" })),
                    dateInput
                )
            )
        )
    );

    let groupDropdown = null;
    let groupField = null;

    if (mode === "normal") {
        groupDropdown = createDropdown({
            options: [],
            placeholder: "Choisir un groupe"
        });

        groupField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Groupe"),
                h("p", { class: "form-field__description" }, "Optionnel. Classez votre tâche dans un groupe.")
            ),
            groupDropdown.el
        );
    }

    const noteDropdown = createDropdown({
        options: [],
        placeholder: "Aucune note sélectionnée"
    });

    const noteField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", {}, "Note liée"),
            h("p", { class: "form-field__description" }, "Optionnel. Associez une note à cette tâche.")
        ),
        noteDropdown.el
    );

    const subtaskManager = createSubtaskListManager();
    const titleValidator = formFieldValidate(titleField);

    function fetchDropdownDate() {
        if (mode === "normal") {
            getAllGroups().then(groups => {
                groupDropdown.update(groups.map(g => ({
                    value: g.id,
                    label: g.label,
                    content: [
                        h("span", {
                            class: `group-color group-color--bullet group-color--md group-color--${g.color}`,
                            "aria-hidden": "true"
                        }),
                        g.label
                    ]
                })));
            });
        }

        getAllNotes().then(notes => {
            noteDropdown.update(notes.map(n => ({
                value: n.id,
                label: n.title,
                content: [
                    h("span", {
                        class: `dropdown__option--full-bg note-color--${n.color}`,
                        "aria-hidden": "true"
                    }),
                    n.title
                ]
            })));
        });
    }

    function reset() {
        titleInput.value = "";
        dateInput.value = "";
        titleValidator.reset();
        groupDropdown?.setValue(null, true);
        groupDropdown?.reset();
        noteDropdown.setValue(null, true);
        noteDropdown.reset();
        subtaskManager.reset();
    }

    let externalGroupId = null;
    const content = [
        titleField,
        dateField,
        ...(groupField ? [groupField] : []),
        noteField,
        subtaskManager.el
    ];

    function close() {
        reset();
        dialog.close();
    }

    const dialog = createDialog({
        title: "Créer une tâche",
        content,
        destroyOnClose: false,
        onOverlayClick: close,
        onClose: reset,
        actions: [
            {
                name: "Créer la tâche",
                variant: "primary-outline",
                onClick: safeAsync(async () => {
                    const title = titleInput.value.trim();
                    if (!titleValidator.isValid()) return;

                    const task = await addTask({
                        title,
                        dueDate: dateInput.value || null,
                        groupId: groupDropdown?.getValue() || externalGroupId || null,
                        noteId: noteDropdown?.getValue() || null,
                        subtasks: subtaskManager.getSubtasks(),
                        status: "unfinished"
                    });
                    externalStore.forEach(store => store([...store(), task]));
                    toast.success("Tâche créée avec succès.");
                    reset();
                    dialog.close();
                }, () => {
                    toast.error("Erreur lors de la création de la tâche.");
                })
            },
            {
                name: "Annuler",
                onClick: close
            }
        ]
    });

    return () => {
        fetchDropdownDate();
        if (mode === "group") {
            useCurrentTaskGroup(group => {
                externalGroupId = group.id;
            });
        }
        dialog.open();
    };
}

export function createUpdateTaskDialog(taskId, mode = "normal", externalStore = []) {
    safeAsync(async () => {
        const task = await getTaskById(taskId);
        if (!task) return toast.error("Tâche introuvable.");

        const titleInput = h("input", {
            id: "task-title",
            class: "input__field",
            type: "text",
            placeholder: "Titre de la tâche...",
            value: task.title,
            "aria-label": "Titre de la tâche",
        });

        const titleField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", { for: "task-title" }, "Titre de la tâche"),
                h("p", { class: "form-field__description" }, "Un titre court pour votre tâche.")
            ),
            h("label", { class: "input input--compact", for: "task-title" },
                h("span", { class: "input__content" },
                    h("span", { class: "input__group" }, titleInput)
                )
            )
        );

        const dateInput = h("input", {
            class: "input__field",
            type: "date",
            value: task.dueDate ? splitDate(task.dueDate) : "",
            min: getCurrentDate(),
            onclick() {
                this.min = getCurrentDate();
                this.showPicker?.();
            },
        });

        const dateField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Date d'échéance"),
                h("p", { class: "form-field__description" }, "Date et heure optionnelles de la tâche.")
            ),
            h("label", { class: "input input--compact" },
                h("span", { class: "input__content" },
                    h("span", { class: "input__group" },
                        h("span", {
                            class: "input__icon button button--icon button--compact button--transparent button--static",
                            role: "presentation",
                            "aria-hidden": "true"
                        }, h("i", { class: "button__icon icon icon--calendar" })),
                        dateInput
                    )
                )
            )
        );

        let groupDropdown = null;
        let groupField = null;
        if (mode === "normal") {
            groupDropdown = createDropdown({
                options: [],
                placeholder: "Choisir un groupe"
            });

            groupField = h("section", { class: "form-field" },
                h("div", { class: "form-field__header" },
                    h("label", {}, "Groupe"),
                    h("p", { class: "form-field__description" }, "Optionnel. Classez votre tâche dans un groupe.")
                ),
                groupDropdown.el
            );
        }

        const noteDropdown = createDropdown({
            options: [],
            placeholder: "Aucune note sélectionnée"
        });

        const noteField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", {}, "Note liée"),
                h("p", { class: "form-field__description" }, "Optionnel. Associez une note à cette tâche.")
            ),
            noteDropdown.el
        );

        const subtaskManager = createSubtaskListManager(task.subtasks || []);
        const titleValidator = formFieldValidate(titleField);

        function reset() {
            titleInput.value = task.title;
            dateInput.value = task.dueDate ? splitDate(task.dueDate) : "";
            titleValidator.reset();
            subtaskManager.reset(task.subtasks);
            groupDropdown?.setValue(task.groupId ?? null, true);
            noteDropdown.setValue(task.noteId ?? null, true);
            isClosing = false;
        }

        let isClosing = false;
        function confirmClose() {
            if (isClosing) return;
            const titleChanged = titleInput.value.trim() !== task.title.trim();
            const dateChanged = (dateInput.value || null) !== (splitDate(task.dueDate) || null);
            const groupChanged = (groupDropdown?.getValue() || externalGroupId) !== (task.groupId ?? null);
            const noteChanged = noteDropdown.getValue() !== (task.noteId ?? null);
            const subtasksChanged = !isSubtaskEqual(subtaskManager.getSubtasks(), task.subtasks || []);
            const hasChanges = titleChanged || dateChanged || groupChanged || noteChanged || subtasksChanged;

            if (!hasChanges || window.confirm("Annuler les modifications ?")) {
                isClosing = true;
                dialog.close();
            }
        }

        let externalGroupId = null;
        const content = [titleField, dateField, ...(groupField ? [groupField] : []), noteField, subtaskManager.el];

        const dialog = createDialog({
            title: "Modifier la tâche",
            content,
            destroyOnClose: true,
            onOverlayClick: confirmClose,
            onClose: reset,
            actions: [
                {
                    name: "Enregistrer",
                    variant: "primary-outline",
                    onClick: safeAsync(async () => {
                        const title = titleInput.value.trim();
                        const dueDate = dateInput.value || null;
                        const groupId = groupDropdown?.getValue() || externalGroupId || null;
                        const noteId = noteDropdown.getValue() || null;
                        const subtasks = subtaskManager.getSubtasks();

                        if (!titleValidator.isValid()) return;

                        const updated = await updateTask(task.id, {
                            ...task,
                            title,
                            dueDate,
                            groupId,
                            noteId,
                            subtasks,
                        });

                        externalStore.forEach(store => store(store().map(t => t.id === task.id ? updated : t)));
                        toast.success("Tâche mise à jour avec succès.");
                        dialog.close();
                    }, () => {
                        toast.error("Échec lors de la mise à jour de la tâche.");
                    })
                },
                {
                    name: "Supprimer",
                    variant: "error-outline",
                    onClick: safeAsync(async () => {
                        const confirmDelete = window.confirm("Supprimer cette tâche ? Cette action est irréversible.");
                        if (!confirmDelete) return;

                        await deleteTask(task.id);
                        externalStore.forEach(store => store(store().filter(t => t.id !== task.id)));
                        toast.success("Tâche supprimée.");
                        dialog.close();
                    })
                },
                {
                    name: "Annuler",
                    onClick: confirmClose
                }
            ]
        });

        if (mode === "normal") {
            getAllGroups().then(groups => {
                groupDropdown.update(groups.map(g => ({
                    value: g.id,
                    label: g.label,
                    content: [
                        h("span", {
                            class: `group-color group-color--bullet group-color--md group-color--${g.color}`,
                            "aria-hidden": "true"
                        }),
                        g.label
                    ]
                })));
                groupDropdown.setValue(task.groupId, true);
            });
        }

        getAllNotes().then(notes => {
            noteDropdown.update(notes.map(n => ({
                value: n.id,
                label: n.title,
                content: [
                    h("span", {
                        class: `dropdown__option--full-bg note-color--${n.color}`,
                        "aria-hidden": "true"
                    }),
                    n.title
                ]
            })));
            noteDropdown.setValue(task.noteId, true);
        });

        if (mode === "group") {
            useCurrentTaskGroup(group => {
                externalGroupId = group.id;
            });
        }

        dialog.open();
    }, () => {
        toast.error("Impossible de charger la tâche.");
    })();
}
