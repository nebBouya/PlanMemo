import h from "../../api/h.js";
import { createGroupTab } from "./create.js";
import { groupListSignal } from "./store.js";
import { effect } from "../../api/signals.js";

export function generateGroupKey(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(" ")[0];
}

function emptyGroupTab() {
    return h("li", {
        role: "presentation",
    }, h("a", {
        class: "nav-link nav-link--empty",
    }, "Aucun groupe créé pour le moment. Créez un nouveau groupe."));
}

export function renderGroupTabs(container, ...additionalComponents) {
    effect(() => {
        const groups = groupListSignal();
        container.innerHTML = "";

        const ul = h("ul", {
            class: "nav-list nav-list--vertical",
            role: "tablist"
        },
            ...(groups.length > 0
                ? groups.map(createGroupTab)
                : [emptyGroupTab()])
        );

        container.appendChild(ul);
        for (const component of additionalComponents) {
            if (component instanceof Node)
                container.appendChild(component)
        }
    });

    return container;
}
