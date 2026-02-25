import safeAsync from "../../api/safeAsync.js";
import { initCalendarTasks } from "../calendar/store.js";
import { initTasks } from "./store.js"

export default function initDashTaskServices() {
    safeAsync(initTasks)();
    safeAsync(initCalendarTasks)();
}

export function internalRerenderDashTask() {
    safeAsync(initTasks)();
    safeAsync(initCalendarTasks)();
}