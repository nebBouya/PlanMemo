import logger from "../../../utils/logger.js";

export async function initGroupTable(memoirInstance) {
    try {
        await memoirInstance.createTable("groups", {
            keyPath: "id",
            autoIncrement: true,
            indexes: [
                {
                    name: "key",
                    keyPath: "key",
                    options: { unique: true }
                }
            ]
        });
    } catch (err) {
        logger.error("Error initializing group table:", err);
        throw err;
    }
}