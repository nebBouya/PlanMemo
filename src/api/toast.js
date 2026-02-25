import h from "./h.js";
import { getIcon } from "../services/tokens.js";
import UUID from "./uuid.js";

let toastContainer = null;
const TOAST_DURATION = 4000;
const TOAST_LIMIT = 5;
let toasts = [];
let queue = [];

function ensureToastContainer() {
    if (!toastContainer) {
        toastContainer = h("div", {
            class: "toast-container",
            "aria-live": "polite",
            "aria-atomic": "true",
        });
        document.body.appendChild(toastContainer);
    }
}

function removeToast(id) {
    const toast = toasts.find(t => t.id === id);
    if (!toast) return;

    const el = toast.el;
    el.classList.add("toast--closing");

    el.addEventListener("transitionend", () => {
        el.remove();
        toasts = toasts.filter(t => t.id !== id);
        processQueue();
    }, { once: true });
}

function processQueue() {
    if (queue.length > 0 && toasts.length < TOAST_LIMIT) {
        const next = queue.shift();
        createToast(next);
    }
}

function getToastIcon(variant) {
    switch (variant) {
        default:
        case "info":
            return getIcon("info");
        case "error":
            return getIcon("danger");
        case "success":
            return getIcon("check");
    }
}

function createToast({ message, variant = "info", duration = TOAST_DURATION }) {
    ensureToastContainer();

    const id = UUID();
    const iconEl = h("i", { class: getToastIcon(variant), "aria-hidden": "true" });

    const toastEl = h("div", { class: `toast toast--${variant}`, "data-id": id },
        h("span", { class: "toast__icon" }, iconEl),
        h("span", { class: "toast__message" }, message),
        h("button", {
            class: "toast__close",
            "aria-label": "Fermer",
            onclick: () => removeToast(id)
        }, h("i", { class: getIcon("close"), "aria-hidden": "true" }))
    );

    const toastData = {
        id,
        el: toastEl,
        duration,
        variant,
        message,
    };

    if (toasts.length >= TOAST_LIMIT) {
        queue.push(toastData);
        return;
    }

    toastContainer.appendChild(toastEl);

    let startTime = Date.now();
    let remaining = duration;
    let timeout = setTimeout(() => removeToast(id), remaining);

    toastEl.addEventListener("mouseenter", () => {
        clearTimeout(timeout);
        remaining -= Date.now() - startTime;
    });

    toastEl.addEventListener("mouseleave", () => {
        startTime = Date.now();
        timeout = setTimeout(() => removeToast(id), remaining);
    });

    toasts.push({ id, el: toastEl, timeout });
}

export const toast = {
    info: (msg, duration) => createToast({ message: msg, variant: "info", duration }),
    success: (msg, duration) => createToast({ message: msg, variant: "success", duration }),
    error: (msg, duration) => createToast({ message: msg, variant: "error", duration }),
};
