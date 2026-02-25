import memoir from "../../memoir.js";
import { dbSet, dbUpdate } from "../../tools.js";

export async function addNote(noteData) {
    if (!noteData?.title) {
        throw new Error("Note must have a title.");
    }
    return await dbSet("notes", null, noteData);
}

export async function updateNote(id, updatedData) {
    return await dbUpdate("notes", id, updatedData);
}

export async function deleteNote(id) {
    return await memoir.delete("notes", id);
}

export async function getNoteById(id) {
    return await memoir.get("notes", id);
}

export async function getAllNotes() {
    return await memoir.getAll("notes");
}

export async function getNotesByDate(date) {
    return await memoir.where("notes", note => note.createdAt === date);
}

export async function getNotesCount() {
    return await memoir.count("notes");
}