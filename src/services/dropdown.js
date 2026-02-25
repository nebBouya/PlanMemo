import { attachOutsideListener } from "../api/attachOutideListener.js";
import h from "../api/h.js";
import { isType } from "../utils/general.js";
import { getIcon } from "./tokens.js";

export default function createDropdown({ options = [], placeholder = "Sélectionner...", onChange = () => { }, closest = ".dialog__content", showRemoveBtn = true }) {
    let isOpen = false;
    let currentValue = null;

    const input = h("input", {
        type: "hidden"
    });

    const label = h("span", { class: "dropdown__placeholder" }, placeholder);

    const toggleIcon = h("i", { class: "icon icon--chevron-down", "aria-hidden": "true" });
    const toggleButton = h("button", {
        class: "dropdown__toggle",
        type: "button",
        onClick: () => toggle()
    }, label, toggleIcon);
    const emptyButton = showRemoveBtn ? h("button", {
        class: "button dropdown__empty-btn button--compact button--error-outline button--icon visually-hidden",
        type: "button",
        ariaLabel: "Supprimer la sous-tâche",
        onClick: reset,
    }, h("i", { class: getIcon("remove"), "aria-hidden": "true" })) : null;
    const stack = h("div", {
        class: "stack",
        style: {
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
        }
    }, toggleButton, emptyButton);

    const list = h("ul", { class: "dropdown__menu visually-hidden" },
        ...options.map(opt => {
            return h("li", {
                class: "dropdown__option",
                "aria-label": opt.label,
                onClick: () => {
                    setValue(opt.value);
                    close();
                }
            }, ...(isType(opt.content, "array") ? opt.content : [opt.content]));
        })
    );

    const wrapper = h("div", { class: "dropdown dropdown--compact" }, input, stack, list);

    function open() {
        isOpen = true;
        list.classList.remove("visually-hidden");
        const rect = list.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const container = wrapper.closest(closest) || document.body;
        const containerRect = container.getBoundingClientRect();
        const spaceBelow = containerRect.bottom - wrapperRect.bottom;
        const spaceAbove = wrapperRect.top - containerRect.top;
        const needsFlip = spaceBelow < rect.height && spaceAbove > spaceBelow;
        list.classList.toggle("dropdown__menu--above", needsFlip);
        list.classList.toggle("dropdown__menu--below", !needsFlip);
        toggleButton.classList.add("dropdown__toggle--open");
        toggleIcon.classList.remove("icon--chevron-down");
        toggleIcon.classList.add("icon--chevron-up");
    }


    function close() {
        isOpen = false;
        list.classList.add("visually-hidden");
        toggleButton.classList.remove("dropdown__toggle--open");
        toggleIcon.classList.add("icon--chevron-down");
        toggleIcon.classList.remove("icon--chevron-up");
    }

    function toggle(force) {
        if (force === true) return open();
        if (force === false) return close();
        isOpen ? close() : open();
    }

    function setValue(value, silentSet = false) {
        const found = options.find(o => o.value === value);
        if (!found) return;
        currentValue = value;
        input.value = value;
        label.textContent = found.label || found.content?.textContent || placeholder;
        emptyButton?.classList.remove("visually-hidden");
        if (!silentSet)
            onChange?.(value);
    }

    function update(newList = []) {
        list.innerHTML = "";
        options = newList;
        for (const item of newList) {
            list.append(h("li", {
                class: "dropdown__option",
                "aria-label": item.label,
                onClick: () => {
                    setValue(item.value);
                    close();
                }
            }, ...(isType(item.content, "array") ? item.content : [item.content])));
        }
    }

    function reset() {
        currentValue = null;
        input.value = null;
        label.textContent = placeholder;
        emptyButton.classList.add("visually-hidden");
        close();
    }

    function getValue() {
        return currentValue;
    }

    const destroyOutideListener = attachOutsideListener(wrapper, () => isOpen, close, { listenBlur: true });

    return {
        el: wrapper,
        getValue,
        setValue,
        update,
        toggle,
        reset,
        open,
        close,
        destroy: destroyOutideListener
    };
}