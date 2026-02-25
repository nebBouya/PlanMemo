import memoir from "./memoir.js";
import { initGroupTable } from "./tables/groups/init.js";
import { initNoteTable } from "./tables/notes/init.js";
import { initTaskTable } from "./tables/tasks/init.js";

export default async function initDB() {
    await memoir.connect({});
    await initGroupTable(memoir);
    await initNoteTable(memoir);
    await initTaskTable(memoir);
}