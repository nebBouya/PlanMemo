import memoir from "./memoir.js";

export async function dbSet(table, key, data) {
    const now = new Date().toISOString();
    return await memoir.set(table, key, {
        ...data,
        createdAt: now,
        updatedAt: now,
    });
}

export async function dbUpdate(table, id, data) {
    const now = new Date().toISOString();
    return await memoir.update(table, id, {
        ...data,
        updatedAt: now,
    });
}
