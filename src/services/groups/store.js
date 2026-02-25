import { effect, signal } from "../../api/signals.js";
import { getTasksByGroupId } from "../../db/tables/tasks/services.js"
import { getGroupByKey } from "../../db/tables/groups/services.js"
import safeAsync from "../../api/safeAsync.js";

export const groupTaskListSignal = signal([]);
export const currentGroupKey = signal(null);

export async function initGroupTasks(groupKey) {
    currentGroupKey(groupKey);
    const group = await getGroupByKey(groupKey);
    const tasks = await getTasksByGroupId(group.id);
    groupTaskListSignal(tasks);
}

export async function getCurrentTaskGroup() {
    const key = currentGroupKey();
    return await getGroupByKey(key);
}

export const useCurrentTaskGroup = safeAsync(async (fn) => {
    effect(async () => {
        currentGroupKey();
        const group = await getCurrentTaskGroup();
        fn(group);
    })
});