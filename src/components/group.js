import initGroupTaskServices, { internalRerenderGroupTask } from "../services/groups/index.js";
import { renderTasks } from "../services/tasks/render.js";
import { groupTaskListSignal } from "../services/groups/store.js";


export default function initGroupTasks(groupKey) {
    initGroupTaskServices(groupKey);
    renderTasks(document.getElementById("layout_group-tasks--component"), groupTaskListSignal, "group");
}

export function rerenderGroupTasks(groupKey) {
    internalRerenderGroupTask(groupKey);
}