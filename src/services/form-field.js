import h from "../api/h.js";

export function formFieldValidate(field, customRules = []) {
    const input = field.querySelector("input, textarea, select");
    if (!input) return;

    const wrapper = input.closest(".input");
    if (!wrapper) return;

    const helpNode = wrapper.querySelector(".input__help") || h("p", {
        class: "input__help",
        "aria-live": "polite"
    });

    const type = input.type || "text";

    const defaultRules = {
        text: [
            {
                errMsg: "Ce champ ne peut pas être vide.",
                fail: val => val.trim() === ""
            }
        ],
        email: [
            {
                errMsg: "Adresse e-mail invalide.",
                fail: val => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
            }
        ],
        number: [
            {
                errMsg: "Ce champ ne peut pas être vide.",
                fail: val => val.trim() === ""
            },
            {
                errMsg: "La valeur doit être un nombre positif.",
                fail: val => {
                    const num = Number(val);
                    return isNaN(num) || num < 0;
                }
            },
            {
                errMsg: "La valeur est hors de la plage autorisée.",
                fail: (val, input) => {
                    const num = Number(val);
                    if (isNaN(num)) return false;

                    const min = input.min !== "" ? Number(input.min) : -Infinity;
                    const max = input.max !== "" ? Number(input.max) : Infinity;

                    return num < min || num > max;
                }
            }
        ]
    };
    defaultRules.search = defaultRules.text;

    const rules = [...(defaultRules[type] || []), ...(customRules || [])];

    function showError(msg) {
        helpNode.remove();
        wrapper.classList.remove("input--success");
        wrapper.classList.add("input--error");

        helpNode.textContent = msg;
        if (!helpNode.isConnected) {
            wrapper.appendChild(helpNode);
        }
    }

    function showSuccess() {
        wrapper.classList.remove("input--error");
        wrapper.classList.add("input--success");

        if (helpNode.isConnected) {
            helpNode.remove();
        }
    }

    function validate() {
        const value = input.value;
        const failedRule = rules.find(rule => rule.fail(value, input));
        if (failedRule) {
            showError(failedRule.errMsg);
            return false;
        } else {
            showSuccess();
            return true;
        }
    }


    input.addEventListener("input", validate);
    return {
        isValid: validate,
        reset() {
            wrapper.classList.remove("input--error");
            wrapper.classList.remove("input--success");
        },
        get formInput() {
            return input
        }
    }
}
