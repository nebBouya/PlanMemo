import initSidebar from "../services/sidebar/index.js";
import logger from "../utils/logger.js";
import initDB from "../db/index.js";
import TabService from "../services/tab.js";
import initDashboard, { rerenderDashTask } from "../components/dashboard.js";
import initTasks, { rerenderTasks } from "../components/list.js";
import initCalendar, { rerenderCalendar } from "../components/calendar.js";
import initNotes, { rerenderNotes } from "../components/notes.js";
import initGroupTasks, { rerenderGroupTasks } from "../components/group.js";
import InitConfig from "./init.js";
import safeAsync from "../api/safeAsync.js";

(function (window, document) {
    const initApp = safeAsync(async () => {
        await initDB();
        InitConfig();
        initSidebar();
        TabService.init({
            views: {
                "dashboard": {
                    onInit: initDashboard,
                    onView: rerenderDashTask
                },
                "list": {
                    onInit: initTasks,
                    onView: rerenderTasks
                },
                "calendar": {
                    onInit: initCalendar,
                    onView: rerenderCalendar
                },
                "notes": {
                    onInit: initNotes,
                    onView: rerenderNotes
                }
            },
            group: {
                onInit: initGroupTasks,
                onGroupChange: rerenderGroupTasks
            }
        });
    }, (err) => logger.error("Failed to initialize database:", err));

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
    window.addEventListener("unhandledrejection", (event) => {
        logger.error("Unhandled promise rejection:", event.reason);
    });
    window.addEventListener("error", (event) => {
        logger.error("Unhandled error:", event.error || event.message);
    });
})(window, document);