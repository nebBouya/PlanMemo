import safeAsync from "../../api/safeAsync.js";
import { createAddNoteDialog } from "./create.js";
import { initNotes } from "./store.js"

export default function initNotesServices() {
    safeAsync(initNotes)();
    const openAddNote = createAddNoteDialog();
    document.getElementById("layout_notes--trigger").addEventListener("click", () => {
        openAddNote();
    })
}

export function internalRerenderNotes() {
    safeAsync(initNotes)();
}