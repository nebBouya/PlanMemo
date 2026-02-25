import memoir from "../../memoir.js";
import { dbSet, dbUpdate } from "../../tools.js";

export async function addGroup(groupData) {
    if (!groupData?.key) {
        throw new Error("Group key is required.");
    }
    const exists = await doesGroupKeyExist(groupData.key);
    if (exists) {
        throw new Error(`Group with key '${groupData.key}' already exists.`);
    }
    const group = {
        key: groupData.key,
        label: groupData.label,
        icon: groupData.icon ?? "inbox",
        color: groupData.color ?? "gray"
    }
    return await dbSet("groups", null, group);
}

export async function updateGroup(id, updatedData) {
    return await dbUpdate("groups", id, updatedData);
}

export async function deleteGroup(id) {
    return await memoir.delete("groups", id);
}
export async function getGroupById(id) {
    return await memoir.get("groups", id);
}

export async function getGroupByKey(key) {
    const results = await memoir.where("groups", (g) => g.key === key);
    return results[0] || null;
}

export async function doesGroupKeyExist(key) {
    const result = await getGroupByKey(key);
    return !!result;
}

export async function getAllGroups() {
    return await memoir.getAll("groups");
}

export async function getGroupsCount() {
    return await memoir.count("groups");
}