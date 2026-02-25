import { signal, computed } from "../../api/signals.js";
import { getTasksByDate } from "../../db/tables/tasks/services.js"
import { splitDate } from "../tokens.js";

export const setTaskListSignal = signal([]);
export const dashTaskType = signal(null);
export const getTaskListSignal = computed(() => {
    return setTaskListSignal().filter(task => task.status !== "done")
});

export async function initTasks() {
    const today = splitDate(new Date());

    const strategies = [
        {
            type: "today",
            query: async () => await getTasksByDate(today),
        },
        {
            type: "unscheduled",
            query: async () => await getTasksByDate(null),
        },
    ];

    let data = [];
    let type = "none";

    for (const strategy of strategies) {
        data = await strategy.query();
        if (data.length > 0) {
            type = strategy.type;
            break;
        }
    }

    setTaskListSignal(data);
    dashTaskType(type);
}

