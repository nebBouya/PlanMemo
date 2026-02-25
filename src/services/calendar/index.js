import safeAsync from "../../api/safeAsync.js";
import { createFullCalendar } from "./render.js";
import { initCalendarTasks } from "./store.js";

let triggerRerender = null;
export default function initFullCalendarServices() {
    const { el, rerender } = createFullCalendar();
    triggerRerender = rerender;
    safeAsync(initCalendarTasks)();
    return el;
}

export function internalRerenderFullCalendar() {
    if (triggerRerender) triggerRerender();
    safeAsync(initCalendarTasks)();
}