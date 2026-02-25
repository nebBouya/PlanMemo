import safeAsync from "../../api/safeAsync.js";
import { createTaskDialog } from "../tasks/create.js";
import { createUpdateGroupDialog } from "./create.js";
import { initGroupTasks, groupTaskListSignal, useCurrentTaskGroup, getCurrentTaskGroup } from "./store.js";

function updateTitle() {
    useCurrentTaskGroup((group) => {
        if (!group) return;
        document.getElementById("layout__header--group-title").innerText = `Tâches du groupe ${group.label}`;
    })
}

export default function initGroupTaskServices() {
    const openAddGroupTask = createTaskDialog("group", [groupTaskListSignal]);
    updateTitle();
    document.getElementById("layout_group-tasks--trigger").addEventListener("click", () => {
        openAddGroupTask();
    });
    document.getElementById("layout_edit-group--trigger").addEventListener("click", () => {
        safeAsync(async () => {
            const group = await getCurrentTaskGroup();
            createUpdateGroupDialog(group.key)
        })();
    });
}

export function internalRerenderGroupTask(groupKey) {
    safeAsync(initGroupTasks)(groupKey);
}