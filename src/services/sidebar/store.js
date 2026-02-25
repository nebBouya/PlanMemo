import { signal } from "../../api/signals.js";
import { getAllGroups } from "../../db/tables/groups/services.js"

export const groupListSignal = signal([]);

export async function initGroupTabs() {
    const groups = await getAllGroups();
    groupListSignal(groups);
}