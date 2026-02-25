import h from "../../api/h.js";
import { getNoteColor, NOTE_COLORS } from "../tokens.js";
import { toast } from "../../api/toast.js";
import safeAsync from "../../api/safeAsync.js";
import { formFieldValidate } from "../form-field.js";
import createDialog from "../dialog.js";
import { addNote, updateNote, deleteNote, getNoteById } from "../../db/tables/notes/services.js";
import { noteListSignal } from "./store.js";

export function createAddNoteDialog() {
    const titleInput = h("input", {
        id: "note-title",
        class: "input__field",
        type: "text",
        placeholder: "Titre de la note...",
        "aria-label": "Titre de la note",
        "aria-describedby": "note-title-desc",
    });

    const titleField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", { for: "note-title" }, "Titre de la note"),
            h("p", { class: "form-field__description" }, "Un titre court pour identifier rapidement cette note.")
        ),
        h("label", { class: "input input--compact", for: "note-title" },
            h("span", { class: "input__content" },
                h("span", { class: "input__group" }, titleInput)
            )
        )
    );

    const colorRadios = NOTE_COLORS.map(color =>
        h("label", { class: "radio-choice" },
            h("input", {
                type: "radio",
                name: "color",
                value: color,
                onchange: () => {
                    textarea.className = `note-textarea ${getNoteColor(color)}`;
                }
            }),
            h("span", {
                class: `radio-choice__visual group-color ${getNoteColor(color)}`,
                "aria-hidden": "true"
            })
        )
    );

    const colorField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", { for: "note-color" }, "Choisir une couleur"),
            h("p", { class: "form-field__description" }, "La couleur permettra de mieux distinguer vos notes.")
        ),
        h("div", { class: "radio-grid", id: "note-color" }, ...colorRadios)
    );

    const textarea = h("textarea", {
        id: "note-content",
        class: `note-textarea ${getNoteColor(NOTE_COLORS[0])}`,
        placeholder: "Écrivez votre note ici...",
    });

    const contentField = h("section", { class: "form-field" },
        h("div", { class: "form-field__header" },
            h("label", { for: "note-content" }, "Contenu de la note"),
            h("p", { class: "form-field__description" }, "Rédigez le contenu principal de votre note ici.")
        ),
        textarea
    );

    const titleValidator = formFieldValidate(titleField);

    const reset = () => {
        titleInput.value = "";
        textarea.value = "";
        textarea.className = `note-textarea ${getNoteColor(NOTE_COLORS[0])}`;
        colorField.querySelectorAll("input").forEach(input => input.checked = false);
        titleValidator.reset();
    };

    const content = [titleField, colorField, contentField];

    const dialog = createDialog({
        title: "Créer une note",
        content,
        destroyOnClose: false,
        onOverlayClick: () => {
            dialog.close();
            reset();
        },
        onClose: reset,
        actions: [
            {
                name: "Créer la note",
                variant: "primary-outline",
                onClick: safeAsync(async () => {
                    const title = titleInput.value.trim();
                    const color = colorField.querySelector("input[name='color']:checked")?.value || NOTE_COLORS[0];
                    const content = textarea.value.trim();
                    if (!titleValidator.isValid()) return;
                    const note = await addNote({
                        title,
                        content,
                        color
                    });
                    noteListSignal([...noteListSignal(), note]);
                    toast.success("La note a été créée avec succès.");
                    reset();
                    dialog.close();
                }, () => {
                    toast.error("Échec lors de la création de la note.");
                })
            },
            {
                name: "Annuler",
                onClick: () => {
                    reset();
                    dialog.close();
                }
            }
        ],
    });

    return () => {
        dialog.open();
    };
}

export function createUpdateNoteDialog(noteId) {
    safeAsync(async () => {
        const note = await getNoteById(noteId);
        if (!note) {
            toast.error("Note introuvable.");
            return;
        }

        const titleInput = h("input", {
            id: "note-title",
            class: "input__field",
            type: "text",
            placeholder: "Titre de la note...",
            value: note.title,
            "aria-label": "Titre de la note",
            "aria-describedby": "note-title-desc"
        });

        const titleField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", { for: "note-title" }, "Titre de la note"),
                h("p", { class: "form-field__description" }, "Un titre court pour identifier rapidement cette note.")
            ),
            h("label", { class: "input input--compact", for: "note-title" },
                h("span", { class: "input__content" },
                    h("span", { class: "input__group" }, titleInput)
                )
            )
        );

        const textarea = h("textarea", {
            id: "note-content",
            class: `note-textarea ${getNoteColor(note.color)}`,
            placeholder: "Écrivez votre note ici..."
        });

        textarea.value = note.content;

        const colorRadios = NOTE_COLORS.map(color =>
            h("label", { class: "radio-choice" },
                h("input", {
                    type: "radio",
                    name: "color",
                    value: color,
                    checked: note.color === color,
                    onchange: () => {
                        textarea.className = `note-textarea ${getNoteColor(color)}`;
                    }
                }),
                h("span", {
                    class: `radio-choice__visual group-color ${getNoteColor(color)}`,
                    "aria-hidden": "true"
                })
            )
        );

        const colorField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", { for: "note-color" }, "Choisir une couleur"),
                h("p", { class: "form-field__description" }, "La couleur permettra de mieux distinguer vos notes.")
            ),
            h("div", { class: "radio-grid", id: "note-color" }, ...colorRadios)
        );

        const contentField = h("section", { class: "form-field" },
            h("div", { class: "form-field__header" },
                h("label", { for: "note-content" }, "Contenu de la note"),
                h("p", { class: "form-field__description" }, "Rédigez le contenu principal de votre note ici.")
            ),
            textarea
        );

        const validator = formFieldValidate(titleField);

        const reset = () => {
            titleInput.value = note.title;
            textarea.value = note.content;
            textarea.className = `note-textarea ${getNoteColor(note.color)}`;
            colorField.querySelectorAll("input").forEach(input => {
                input.checked = input.value === note.color;
            });
            validator.reset();
            isClosing = false;
        };
        let isClosing = false;

        function confirmClose() {
            if (isClosing) return;

            const titleChanged = titleInput.value.trim() !== note.title.trim();
            const contentChanged = textarea.value.trim() !== note.content.trim();
            const selectedColor = colorField.querySelector("input[name='color']:checked")?.value || NOTE_COLORS[0];
            const colorChanged = selectedColor !== note.color;

            const hasChanges = titleChanged || contentChanged || colorChanged;

            if (!hasChanges || window.confirm("Annuler les modifications ?")) {
                isClosing = true;
                dialog?.close();
            }
        }


        const dialog = createDialog({
            title: "Modifier la note",
            content: [titleField, colorField, contentField],
            destroyOnClose: true,
            onOverlayClick: confirmClose,
            onClose: reset,
            actions: [
                {
                    name: "Enregistrer",
                    variant: "primary-outline",
                    onClick: safeAsync(async () => {
                        const newTitle = titleInput.value.trim();
                        const newColor = colorField.querySelector("input[name='color']:checked")?.value || NOTE_COLORS[0];
                        const newContent = textarea.value.trim();
                        if (!validator.isValid()) return;
                        const updated = await updateNote(note.id, {
                            ...note,
                            title: newTitle,
                            content: newContent,
                            color: newColor
                        });
                        const updatedList = noteListSignal().map(n => n.id === note.id ? updated : n);
                        noteListSignal(updatedList);

                        toast.success("Note mise à jour avec succès.");
                        dialog.close();
                    }, () => {
                        toast.error("Échec lors de la mise à jour de la note.");
                    })
                },
                {
                    name: "Supprimer",
                    variant: "error-outline",
                    onClick: safeAsync(async () => {
                        const confirmDelete = window.confirm("Supprimer cette note ? Cette action est irréversible.");
                        if (!confirmDelete) return;

                        await deleteNote(note.id);
                        noteListSignal(noteListSignal().filter(n => n.id !== note.id));
                        toast.success("Note supprimée.");
                        dialog.close();
                    })
                },
                {
                    name: "Annuler",
                    onClick: confirmClose
                }
            ]
        });

        dialog.open();
    }, () => {
        toast.error("Impossible de charger la note.");
    })();
}

export function createReadNoteDialog(noteId) {
    safeAsync(async () => {
        const note = await getNoteById(noteId);
        if (!note) {
            toast.error("Note introuvable.");
            return;
        }
        const content = h("article", { class: "note-preview", style: { lineHeight: "1.3" } }, note.content);
        const dialog = createDialog({
            title: `Note : ${note.title}`,
            content: [content],
            destroyOnClose: true,
            actions: [
                {
                    name: "Fermer",
                    variant: ["button--note-modal"],
                    onClick: () => {
                        dialog.close();
                    }
                }
            ],
            customWindowClass: ["dialog__window--note", `note-color--${note.color}`]
        });
        dialog.open();
    }, () => {
        toast.error("Impossible de charger la note.");
    })();
}

export function createNoteMenu() { }