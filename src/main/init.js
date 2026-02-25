import h from "../api/h.js";
import { effect, signal } from "../api/signals.js";
import { formFieldValidate } from "../services/form-field.js";
import createDialog from "../services/dialog.js";
import safeAsync from "../api/safeAsync.js";
import { toast } from "../api/toast.js";
import watchMedia from "../services/media.js";
import { exportSummary } from "./print.js";
import { initPomodoro } from "../services/pomodoro/index.js";
import { bindSettingToSignal, syncThemeDependentImages } from "../services/effectTools.js";
import { attachOutsideListener } from "../api/attachOutideListener.js";
import { renderMiniPomodoro } from "../services/dashboard/mini-pomodoro.js";

export const currentTheme = signal("light");
export const currentUser = signal({ firstName: "", lastName: "" });

function createSettings() {
    let firstTime = false;
    const firstNameInput = h('input', {
        id: 'first-name',
        class: 'input__field',
        type: 'text',
        placeholder: 'Prénom...',
        'aria-label': 'Prénom',
        'aria-describedby': 'first-name-desc'
    });

    const firstNameFormField = h('section', { class: 'form-field' },
        h('div', { class: 'form-field__header' },
            h('label', { for: 'first-name' }, 'Prénom'),
            h('p', { id: 'first-name-desc', class: 'form-field__description' }, 'Votre prénom sera utilisé dans l’application.')
        ),
        h('label', { class: 'input input--compact', for: 'first-name' },
            h('span', { class: 'input__content' },
                h('span', { class: 'input__group' }, firstNameInput)
            )
        )
    );

    const lastNameInput = h('input', {
        id: 'last-name',
        class: 'input__field',
        type: 'text',
        placeholder: 'Nom...',
        'aria-label': 'Nom',
        'aria-describedby': 'last-name-desc'
    });

    const lastNameFormField = h('section', { class: 'form-field' },
        h('div', { class: 'form-field__header' },
            h('label', { for: 'last-name' }, 'Nom'),
            h('p', { id: 'last-name-desc', class: 'form-field__description' }, 'Votre nom sera utilisé dans l’application.')
        ),
        h('label', { class: 'input input--compact', for: 'last-name' },
            h('span', { class: 'input__content' },
                h('span', { class: 'input__group' }, lastNameInput)
            )
        )
    );

    const themeToggle = h("input", {
        class: "checkbox__input",
        type: "checkbox",
        checked: currentTheme() === "dark"
    });

    const themeSwitchFormField = h("fieldset", { class: "checkbox checkbox--switch", style: { width: "100%" } },
        h("label", { class: "checkbox__label", style: { width: "100%" } },
            h("span", { class: "checkbox__text" }, "Activer le thème sombre"),
            themeToggle
        )
    );

    const validateFirstName = formFieldValidate(firstNameFormField);
    const validateLastName = formFieldValidate(lastNameFormField);

    const content = [
        firstNameFormField,
        lastNameFormField,
        themeSwitchFormField
    ];

    const dialog = createDialog({
        title: "",
        content,
        destroyOnClose: false,
        onOverlayClick: () => {
            if (!firstTime) dialog.close();
        },
        actions: []
    });

    return (ft = false) => {
        firstTime = ft;
        const { firstName, lastName } = currentUser();
        firstNameInput.value = firstName || "";
        lastNameInput.value = lastName || "";
        themeToggle.checked = currentTheme() === "dark";
        dialog.update({
            title: firstTime ? 'Configurer votre profil' : 'Paramètres de l’application',
            actions: [
                {
                    name: "Enregistrer",
                    variant: "primary-outline",
                    onClick: safeAsync(async () => {
                        if (!validateFirstName.isValid() || !validateLastName.isValid()) return;
                        const firstName = firstNameInput.value.trim();
                        const lastName = lastNameInput.value.trim();
                        const theme = themeToggle.checked ? "dark" : "light";
                        currentUser({ firstName, lastName });
                        currentTheme(theme);
                        toast.success(`Profil mis à jour avec succès.`);
                        dialog.close();
                    }, () => {
                        toast.error("Échec lors de la mise à jour.");
                    })
                },
                ...(!firstTime ? [{
                    name: "Annuler",
                    onClick: () => {
                        dialog.close();
                    }
                }] : [])
            ]
        })
        dialog.open();
    };
}

function initHeader(settingsDialog) {
    const openPomodoro = initPomodoro();
    const wrapper = document.getElementById("mobile_action--wrapper");
    const trigger = document.getElementById("mobile_action--trigger");
    const panel = document.getElementById("mobile_action--panel");
    let isOpen = false;

    function openPanel() {
        isOpen = true;
        wrapper.classList.add("dashboard-header__nav--expanded");
        panel.classList.remove("visually-hidden");
    }

    function closePanel() {
        isOpen = false;
        wrapper.classList.remove("dashboard-header__nav--expanded");
        panel.classList.add("visually-hidden");
    }

    trigger.addEventListener("click", (e) => {
        e.preventDefault();
        isOpen ? closePanel() : openPanel();
    });

    attachOutsideListener(wrapper, () => isOpen, closePanel, { listenBlur: true });

    const closeModal = watchMedia("(min-width: 700px)");

    effect(() => {
        const close = closeModal();
        if (close) closePanel();
    });

    const actionMap = {
        resume: () => exportSummary(),
        pomodoro: () => openPomodoro(),
        settings: () => settingsDialog(),
    };

    function handleActionClick(type) {
        if (actionMap[type]) {
            actionMap[type]();
            if (isOpen) closePanel();
        }
    }

    const buttons = document.querySelectorAll('[data-header-action-type]');
    buttons.forEach(button => {
        const type = button.getAttribute('data-header-action-type');
        button.addEventListener('click', () => handleActionClick(type));
    });


    document.getElementById("mini-pomodoro")?.append(renderMiniPomodoro(openPomodoro));
}

export default function InitConfig() {
    const { firstName } = currentTheme();
    const settingsDialog = createSettings();
    if (firstName === "") settingsDialog(true);
    bindSettingToSignal("user.theme", currentTheme, (n) => {
        document.documentElement.dataset.uiState = n;
        syncThemeDependentImages(n);
    });
    bindSettingToSignal("user.internal.data", currentUser);
    initHeader(settingsDialog);
}
