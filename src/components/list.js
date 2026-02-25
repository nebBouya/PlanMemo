import initTaskServices, { internalRerenderTask } from "../services/tasks/index.js";
import { renderTasks } from "../services/tasks/render.js";
import { taskListSignal } from "../services/tasks/store.js";

export default function initTasks() {
    initTaskServices();
    renderTasks(document.getElementById("layout_tasks--component"), taskListSignal);
}

export function rerenderTasks() {
    internalRerenderTask();
}