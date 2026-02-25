import safeAsync from "../../api/safeAsync.js";
import { createTaskDialog } from "./create.js";
import { initTasks, taskListSignal } from "./store.js"

export default function initTaskServices() {
    safeAsync(initTasks)();
    const openAddTask = createTaskDialog("normal", [taskListSignal]);
    document.getElementById("layout_tasks--trigger").addEventListener("click", () => {
        openAddTask();
    })
}

export function internalRerenderTask() {
    safeAsync(initTasks)();
}