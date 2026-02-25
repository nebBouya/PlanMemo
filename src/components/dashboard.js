import initDashTaskServices, { internalRerenderDashTask } from "../services/dashboard/index.js";
import { getTaskListSignal, setTaskListSignal } from "../services/dashboard/store.js";
import initMiniCalendar from "../services/dashboard/mini-calendar.js";
import { renderTasks } from "../services/tasks/render.js";
import { renderGreeting, renderQuickTask } from "../services/dashboard/render.js";

const rerender = [];

export default function initDashboard() {
    const resetCalendar = initMiniCalendar();
    initDashTaskServices();
    renderTasks(document.getElementById("layout_dash-tasks--component"), [getTaskListSignal, setTaskListSignal], "dashboard");
    renderGreeting();
    const resetQuickTask = renderQuickTask();
    rerender.push(resetCalendar, resetQuickTask);
}

export function rerenderDashTask() {
    internalRerenderDashTask();
    rerender.forEach((fn) => fn());
}
