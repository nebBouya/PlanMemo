import { splitDate } from "../../../services/tokens.js";
import { isType } from "../../../utils/general.js";
import memoir from "../../memoir.js";
import { dbSet, dbUpdate } from "../../tools.js";
import { getGroupById } from "../groups/services.js"
import { getNoteById } from "../notes/services.js"

export async function evaluateTaskStatus(task) {
    const { dueDate, status } = task;

    if (!dueDate || status === "done") {
        return status || "unfinished";
    }

    const now = new Date();
    const taskDate = new Date(dueDate);

    const isToday =
        now.getFullYear() === taskDate.getFullYear() &&
        now.getMonth() === taskDate.getMonth() &&
        now.getDate() === taskDate.getDate();

    const isPast = taskDate < now && !isToday;

    if (isPast) {
        return "temp_finished";
    }

    if (isToday) {
        return "in_progress";
    }

    return "unfinished";
}


export async function addTask(taskData) {
    if (!taskData?.title) {
        throw new Error("Task must have a title.");
    }
    const task = {
        title: taskData.title.trim(),
        dueDate: taskData.dueDate ?? null,
        groupId: taskData.groupId ?? null,
        noteId: taskData.noteId ?? null,
        subtasks: isType(taskData.subtasks, "array") ? taskData.subtasks : [],
        status: "unfinished",
    };
    task.status = await evaluateTaskStatus(task);
    const data = await dbSet("tasks", null, task);
    return await enrichTask(data);
}

export async function updateTask(id, updatedData) {
    if ("group" in updatedData) { delete updatedData.group; }
    if ("note" in updatedData) { delete updatedData.note; }
    const data = await dbUpdate("tasks", id, updatedData);
    return await enrichTask(data);
}

export async function updateSubtask(taskId, index, newCheckedState) {
    const task = await getTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) {
        throw new Error("Task or subtasks not found.");
    }
    const updatedSubtasks = [...task.subtasks];
    if (!updatedSubtasks[index]) {
        throw new Error("Subtask index is invalid.");
    }
    updatedSubtasks[index] = {
        ...updatedSubtasks[index],
        checked: !!newCheckedState
    };
    const isAllSubtasksChecked = updatedSubtasks.every(s => s.checked);
    const newStatus = isAllSubtasksChecked ? "done" : await evaluateTaskStatus({
        ...task,
        subtasks: updatedSubtasks
    });
    const updatedTask = await updateTask(taskId, {
        subtasks: updatedSubtasks,
        status: newStatus
    });
    return updatedTask;
}


export async function deleteTask(id) {
    return await memoir.delete("tasks", id);
}

export async function enrichTask(task) {
    let updated = false;

    if (task.groupId != null) {
        const data = await getGroupById(task.groupId);
        if (!data) { task.groupId = null; updated = true; }
        else task.group = data;
    }

    if (task.noteId != null) {
        const data = await getNoteById(task.noteId);
        if (!data) { task.noteId = null; updated = true; }
        else task.note = data;
    }

    const evaluatedStatus = await evaluateTaskStatus(task);
    if (task.status !== evaluatedStatus) {
        task.status = evaluatedStatus;
        updated = true;
    }

    if (updated) {
        await updateTask(task.id, task);
    }

    return task;
}


async function enrichTasks(tasks) {
    return await Promise.all(tasks.map(enrichTask));
}

export async function getTaskById(id) {
    const task = await memoir.get("tasks", id);
    if (!task) return null;
    return enrichTask(task);
}

export async function getAllTasks() {
    const tasks = await memoir.getAll("tasks");
    return enrichTasks(tasks);
}

export async function getTasksByDate(date) {
    const tasks = await memoir.where("tasks", task => task.dueDate === date);
    return enrichTasks(tasks);
}

export async function getAllDuoDateTasks() {
    const tasks = await memoir.where("tasks", task =>
        task.dueDate !== null &&
        (task.status === "in_progress" || task.status === "unfinished")
    );
    return enrichTasks(tasks);
}

export async function getTasksByTitle(title) {
    const tasks = await memoir.where("tasks", task => task.title === title);
    return enrichTasks(tasks);
}

export async function getTasksByStatus(statuses) {
    const isArray = Array.isArray(statuses);
    const tasks = await memoir.where("tasks", task =>
        isArray ? statuses.includes(task.status) : task.status === statuses
    );
    return enrichTasks(tasks);
}

export async function getTasksByGroupId(groupId) {
    const tasks = await memoir.where("tasks", task => task.groupId === groupId);
    return enrichTasks(tasks);
}

export async function getFilteredTasks({ includeToday = true, includeUndated = true } = {}) {
    const today = splitDate(new Date());

    const tasks = await memoir.where("tasks", task => {
        const isToday =
            includeToday &&
            task.dueDate === today &&
            task.status === "in_progress";

        const isUndated =
            includeUndated &&
            !task.dueDate &&
            task.status === "unfinished";

        return isToday || isUndated;
    });

    return enrichTasks(tasks);
}

export async function getTasksCount() {
    return await memoir.count("tasks");
}