import h from "../api/h.js";
import { isType } from "../utils/general.js";

export default function createDialog({
    title = '',
    content = '',
    destroyOnClose = true,
    onClose = () => { },
    onOverlayClick,
    actions = [],
    customWindowClass = []
} = {}) {
    let _dialog = null;
    let destroyed = false;
    if (!isType(customWindowClass, "array")) customWindowClass = [customWindowClass];
    const toNode = (item) => {
        if (isType(item, "string")) {
            return [h("fragment", {}, item)];
        }
        return [item];
    };
    if (!isType(onOverlayClick, "function")) onOverlayClick = () => { close() };
    const createFragment = (input) =>
        h("fragment", {}, ...(isType(input, "array") ? input.flatMap(toNode) : toNode(input)));

    const titleEl = h("h2", { class: "dialog__title", id: "dialog-title" }, title);
    const contentSection = h("section", { class: "dialog__content" }, createFragment(content));
    const footer = h("footer", { class: "dialog__footer" },
        ...actions.map(({ name, onClick: footerOnClick, variant = '' }) =>
            h("button", {
                class: `button button--compact ${isType(variant, "array") ? variant.join(" ") : variant ? `button--${variant}` : ""}`.trim(),
                type: "button",
                "aria-label": name,
                onClick: (e) => {
                    if (isType(footerOnClick, "function")) footerOnClick(e);
                }
            },
                h("span", { class: "button__content" },
                    h("span", { class: "button__group" },
                        h("span", { class: "button__label" }, name)
                    )
                )
            )
        )
    );

    const dialog = h("section", {
        class: "dialog visually-hidden",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "dialog-title"
    },
        h("section", {
            class: "dialog__overlay",
            tabIndex: -1,
            onClick: () => onOverlayClick()
        }),
        h("section", { class: `dialog__window ${customWindowClass.join(" ")}` },
            h("header", { class: "dialog__header" }, titleEl),
            contentSection,
            footer
        )
    );

    _dialog = dialog;
    document.body.appendChild(dialog);

    function open() {
        if (destroyed && _dialog) {
            document.body.appendChild(_dialog);
            destroyed = false;
        }
        dialog.classList.remove("visually-hidden");
        document.body.style.overflow = "hidden";
    }

    function close() {
        dialog.classList.add("visually-hidden");
        if (isType(onClose, "function")) onClose();

        if (destroyOnClose) {
            destroy();
        }
        document.body.style.overflow = "";
    }

    function destroy() {
        if (_dialog) {
            destroyed = true;
            _dialog.remove();
        }
    }

    return {
        open,
        close,
        destroy,
        update({ title, content, actions }) {
            if (title && titleEl) titleEl.textContent = title;
            if (content && contentSection) {
                contentSection.innerHTML = "";
                contentSection.appendChild(createFragment(content));
            }
            if (actions && footer) {
                footer.innerHTML = "";
                footer.append(
                    ...actions.map(({ name, onClick, variant = '', shouldClose = false }) =>
                        h("button", {
                            class: `button button--compact ${variant ? `button--${variant}` : ''}`.trim(),
                            type: "button",
                            "aria-label": name,
                            onClick: (e) => {
                                if (shouldClose) close();
                                if (isType(onClick, "function")) onClick(e);
                            }
                        },
                            h("span", { class: "button__content" },
                                h("span", { class: "button__group" },
                                    h("span", { class: "button__label" }, name)
                                )
                            )
                        )
                    )
                );
            }
        },
        get el() {
            return _dialog;
        },
    };
}
