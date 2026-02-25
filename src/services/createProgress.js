import h from "../api/h.js";
import { signal, effect } from "../api/signals.js";

export function createProgress({
    type = "circular",
    size = "sm",
    label = "",
    smooth = false
} = {}) {
    const value = signal(0);
    const wrapper = h("div", {
        class: `ui-progress ui-progress--${type}` + (type === "circular" ? ` ui-progress--${size}` : ""),
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-label": label || "Progress"
    });

    let labelSpan;
    if (type === "circular") {
        labelSpan = h("div", { class: "ui-progress--label" }, "0%");
        wrapper.append(labelSpan);
    } else if (type === "bar") {
        const track = h("div", { class: "ui-progress--track" });
        wrapper.append(track);
    }

    let animationFrame = null;

    function setValue(target) {
        const clamped = Math.max(0, Math.min(100, target));

        if (!smooth) {
            value(clamped);
            return;
        }

        cancelAnimationFrame(animationFrame);
        const start = value();
        const duration = 400;
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = start + (clamped - start) * progress;
            value(current);
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        }

        animationFrame = requestAnimationFrame(animate);
    }

    effect(() => {
        const val = value();
        const rounded = Math.round(val);
        wrapper.setAttribute("aria-valuenow", rounded);
        wrapper.style.setProperty("--progress", `${val.toFixed(2)}%`);
        if (labelSpan) labelSpan.textContent = `${rounded}%`;
    });

    return {
        get el() {
            return wrapper
        },
        getValue: () => value(),
        setValue
    };
}