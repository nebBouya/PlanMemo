import { signal, computed } from "../../api/signals.js";
import { getAllDuoDateTasks } from "../../db/tables/tasks/services.js";

export const calendarTaskSignal = signal([]);

export const groupedCalendarTasks = computed(() => {
    const map = new Map();

    for (const task of calendarTaskSignal()) {
        const date = task.dueDate;
        if (!date) continue;

        if (!map.has(date)) map.set(date, []);
        map.get(date).push(task);
    }

    return map;
});

export async function initCalendarTasks() {
    const tasks = await getAllDuoDateTasks();
    calendarTaskSignal(tasks);
}