import logger from "../../../utils/logger.js";

export async function initTaskTable(memoirInstance) {
    try {
        await memoirInstance.createTable("tasks", {
            keyPath: "id",
            autoIncrement: true,
            indexes: [
                {
                    name: "dueDate",
                    keyPath: "dueDate",
                    options: { unique: false }
                },
                {
                    name: "title",
                    keyPath: "title",
                    options: { unique: false }
                },
                {
                    name: "status",
                    keyPath: "status",
                    options: { unique: false }
                },
                {
                    name: "groupId",
                    keyPath: "groupId",
                    options: { unique: false }
                }
            ]
        });
    } catch (err) {
        logger.error("Error initializing tasks table:", err);
        throw err;
    }
}
