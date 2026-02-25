import { initTasks } from "./tasks/store.js";
import { initGroupTasks } from "./groups/store.js";
import { initTasks as initDashTasks } from "./dashboard/store.js";

export async function refreshVisibleTaskSignal() {
    const url = new URL(window.location);
    const view = url.searchParams.get("view");
    const group = url.searchParams.get("group");

    if (group) {
        await initGroupTasks(group);
    } else if (view === "dashboard") {
        await initDashTasks();
    } else if (view === "tasks") {
        await initTasks();
    } else {
        await initTasks();
    }
}
