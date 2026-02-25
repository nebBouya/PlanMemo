import { signal } from "../../api/signals.js";
import { getAllTasks } from "../../db/tables/tasks/services.js"

export const taskListSignal = signal([]);

export async function initTasks() {
    const tasks = await getAllTasks();
    taskListSignal(tasks);
}