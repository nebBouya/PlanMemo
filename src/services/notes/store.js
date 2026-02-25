import { signal } from "../../api/signals.js";
import {getAllNotes} from "../../db/tables/notes/services.js"

export const noteListSignal = signal([]);

export async function initNotes() {
    const notes = await getAllNotes();
    noteListSignal(notes);
}