import logger from "../../../utils/logger.js";

export async function initNoteTable(memoirInstance) {
    try {
        await memoirInstance.createTable("notes", {
            keyPath: "id",
            autoIncrement: true,
            indexes: [
                {
                    name: "createdAt",
                    keyPath: "createdAt",
                    options: { unique: false }
                }
            ]
        });
    } catch (err) {
        logger.error("Error initializing notes table:", err);
        throw err;
    }
}
