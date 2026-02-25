import { noteListSignal } from "./store.js";
import { effect } from "../../api/signals.js";
import h from "../../api/h.js";
import { splitDate, getIcon, normalizeDate, truncateText } from "../tokens.js";
import { createUpdateNoteDialog } from "./create.js";

function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Aujourd'hui";
    if (isSameDay(date, yesterday)) return "Hier";

    return normalizeDate(date);
}


function createNoteCard(note) {
    return h("article", { class: `note-card note-color--${note.color}`, onClick: () => createUpdateNoteDialog(note.id) },
        h("h3", { class: "note-card__title" }, note.title),
        h("p", { class: "note-card__snippet" }, truncateText(note.content))
    );
}

function createNoteSlot(date, notes) {
    return h("section", {
        class: "layout__slot note-slot",
        "data-date": date
    },
        h("h2", { class: "layout__slot--title note-slot__title" }, formatDateLabel(date)),
        h("div", { class: "layout__slot--grid note-slot__grid" },
            ...notes.map(createNoteCard)
        )
    );
}

function createEmptyNoteState() {
    return h("section", { class: "layout-empty-state note-empty-state" },
        h("span", { class: "layout-empty-state__icon note-empty-state__icon", "aria-hidden": "true" }, h("i", { class: getIcon("info") })),
        h("h2", { class: "layout-empty-state__title note-empty-state__title" }, "Aucune note trouvée"),
        h("p", { class: "layout-empty-state__description note-empty-state__description" }, "Ajoutez votre première note pour commencer à organiser vos idées.")
    );
}

export function renderNotes() {
    const container = document.getElementById("layout_notes--component");
    if (!container) return;

    effect(() => {
        const notes = noteListSignal();
        container.innerHTML = "";
        if (notes.length === 0) {
            container.appendChild(createEmptyNoteState());
            return;
        }
        const grouped = {};
        for (const note of notes) {
            const date = splitDate(note.createdAt);
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(note);
        }
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        for (const date of sortedDates) {
            const reversedNotes = [...grouped[date]].reverse();
            container.appendChild(createNoteSlot(date, reversedNotes));
        }
    });
}