import initNotesServices, { internalRerenderNotes } from "../services/notes/index.js";
import { renderNotes } from "../services/notes/render.js";

export default function initNotes() {
    initNotesServices();
    renderNotes();
}

export function rerenderNotes() {
    internalRerenderNotes();
}