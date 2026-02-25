import safeAsync from "../api/safeAsync.js";
import { doesGroupKeyExist } from "../db/tables/groups/services.js";

export function handleTabClick(e) {
    const tab = e.currentTarget;
    const type = tab.getAttribute("data-tab-type");
    const target = tab.getAttribute("data-tab-target");
    if (!type || !target) return;
    e.preventDefault();

    if (type === "view") {
        TabService.setView(target);
    } else if (type === "group") {
        TabService.setGroup(target);
    }
}

const viewLifecycles = new Map();
const initializedViews = new Set();
let groupLifecycle = null;
let groupInited = false;
let lastGroup = null;

function fadeSwitch(fromEl, toEl, callback) {
    if (fromEl) {
        fromEl.style.transition = 'opacity 0.3s';
        fromEl.style.opacity = '1';
        requestAnimationFrame(() => {
            fromEl.style.opacity = '0';
            setTimeout(() => {
                fromEl.classList.add('visually-hidden');
                fromEl.style.removeProperty('opacity');
                fromEl.style.removeProperty('transition');
                if (toEl) {
                    toEl.classList.remove('visually-hidden');
                    toEl.style.opacity = '0';
                    toEl.style.transition = 'opacity 0.3s';
                    requestAnimationFrame(() => {
                        toEl.style.opacity = '1';
                        setTimeout(() => {
                            toEl.style.removeProperty('opacity');
                            toEl.style.removeProperty('transition');
                            callback?.();
                        }, 150);
                    });
                } else {
                    callback?.();
                }
            }, 150);
        });
    } else if (toEl) {
        toEl.classList.remove('visually-hidden');
        toEl.style.opacity = '0';
        toEl.style.transition = 'opacity 0.3s';
        requestAnimationFrame(() => {
            toEl.style.opacity = '1';
            setTimeout(() => {
                toEl.style.removeProperty('opacity');
                toEl.style.removeProperty('transition');
                callback?.();
            }, 300);
        });
    } else {
        callback?.();
    }
}


const TabService = {
    init({ views = {}, group = null } = {}) {
        Object.entries(views).forEach(([key, lifecycle]) => {
            viewLifecycles.set(key, lifecycle);
        });

        if (group) {
            groupLifecycle = group;
        }

        this.initTabs();
        this.syncFromUrl();
        this.listenToUrlChanges();
    },

    initTabs() {
        document.querySelectorAll('[data-tab-type="view"], [data-tab-type="group"]')
            .forEach(tab => tab.addEventListener('click', handleTabClick));
    },

    handleViewSwitch(view) {
        let found = false;
        let toShow = null;
        let toHide = null;

        document.querySelectorAll('[data-panel-type="view"]').forEach(panel => {
            const isMatch = panel.getAttribute('data-tab-panel') === view;
            if (isMatch) {
                toShow = panel;
                found = true;
            } else if (!panel.classList.contains('visually-hidden')) {
                toHide = panel;
            }
        });

        fadeSwitch(toHide, toShow);

        const groupPanel = document.querySelector('[data-panel-type="group"]');
        if (groupPanel) groupPanel.classList.add('visually-hidden');
        document.querySelectorAll('[data-tab-type="view"]').forEach(tab => {
            const match = tab.getAttribute('data-tab-target') === view;
            tab.classList.toggle('current-tab', match);
            tab.setAttribute('aria-selected', match);
            tab.setAttribute('tabindex', match ? '0' : '-1');
        });
        document.querySelectorAll('[data-tab-type="group"]').forEach(tab => {
            tab.classList.remove('current-tab');
            tab.setAttribute('aria-selected', false);
            tab.setAttribute('tabindex', '-1');
        });
        const lifecycle = viewLifecycles.get(view);
        const isFirstTime = !initializedViews.has(view);
        if (lifecycle) {
            if (isFirstTime) {
                lifecycle.onInit?.();
                initializedViews.add(view);
            } else {
                lifecycle.onView?.();
            }
        }

        this.toggle404(!found && view !== null);
    },

    handleGroupSwitch(groupName) {
        let currentVisible = null;
        let found = false;

        document.querySelectorAll('[data-panel-type="view"]').forEach(panel => {
            if (!panel.classList.contains('visually-hidden')) {
                currentVisible = panel;
            }
        });

        const groupPanel = document.querySelector('[data-panel-type="group"]');
        if (groupPanel) {
            groupPanel.setAttribute('data-tab-panel', groupName);
            found = true;
            fadeSwitch(currentVisible, groupPanel);
        }

        document.querySelectorAll('[data-tab-type="group"]').forEach(tab => {
            const match = tab.getAttribute('data-tab-target') === groupName;
            tab.classList.toggle('current-tab', match);
            tab.setAttribute('aria-selected', match);
            tab.setAttribute('tabindex', match ? '0' : '-1');
        });

        document.querySelectorAll('[data-tab-type="view"]').forEach(tab => {
            tab.classList.remove('current-tab');
            tab.setAttribute('aria-selected', false);
            tab.setAttribute('tabindex', '-1');
        });

        if (groupLifecycle) {
            const isFirstInit = !groupInited;
            const isDifferentGroup = lastGroup !== groupName;

            if (isFirstInit) {
                groupLifecycle.onInit?.(groupName);
                groupInited = true;
                lastGroup = groupName;
                groupLifecycle.onGroupChange?.(groupName);
            } else if (isDifferentGroup) {
                groupLifecycle.onGroupChange?.(groupName);
                lastGroup = groupName;
            }
        }

        this.toggle404(!found && groupName !== null);
    },

    setView(view) {
        const url = new URL(window.location);
        url.searchParams.set('view', view);
        url.searchParams.delete('group');
        history.pushState({}, '', url);
        lastGroup = null;
        this.handleViewSwitch(view);
    },

    setGroup: safeAsync(async function (groupName) {
        const exists = await doesGroupKeyExist(groupName);
        if (!exists) {
            TabService.toggle404(true);
            return;
        }
        const url = new URL(window.location);
        url.searchParams.set('group', groupName);
        url.searchParams.delete('view');
        history.pushState({}, '', url);

        TabService.handleGroupSwitch(groupName);
    }),

    syncFromUrl() {
        const url = new URL(window.location);
        const params = url.searchParams;
        const view = params.get('view');
        const group = params.get('group');

        if (view) {
            this.setView(view);
        } else if (group) {
            this.setGroup(group);
        } else {
            url.search = '';
            history.replaceState({}, '', url);
            this.setView("dashboard");
        }
    }
    ,

    listenToUrlChanges() {
        window.addEventListener('popstate', () => this.syncFromUrl());
    },

    toggle404(show) {
        const notFound = document.querySelector('[data-panel-type="not-found"]');
        if (notFound) {
            notFound.classList.toggle('visually-hidden', !show);
        }
    }
};

export default TabService;

