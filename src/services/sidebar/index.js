import { createGroupModal, createGroupDialog } from "./create.js";
import { renderGroupTabs } from "./render.js";
import { initGroupTabs } from "./store.js";
import safeAsync from "../../api/safeAsync.js";



export default function initSidebar() {
    safeAsync(initGroupTabs)();
    const staticGroupContainer = document.getElementById("main__nav-tab");
    if (staticGroupContainer) {
        staticGroupContainer.innerHTML = "";
        renderGroupTabs(staticGroupContainer);
    }
    const openModal = createGroupModal();
    const openDialog = createGroupDialog();
    document.getElementById("group__modal")?.addEventListener("click", () => {
        openModal();
    });
    document.getElementById("add__group")?.addEventListener("click", () => {
        openDialog();
    });
}

