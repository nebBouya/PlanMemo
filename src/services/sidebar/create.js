import createModal from '../modal.js';
import createDialog from '../dialog.js';
import watchMedia from '../media.js';
import { ICONS, COLORS, getColor, getIcon } from '../tokens.js';
import h from "../../api/h.js";
import { renderGroupTabs, generateGroupKey } from "./render.js";
import { effect } from "../../api/signals.js";
import { formFieldValidate } from '../form-field.js';
import { toast } from "../../api/toast.js";
import safeAsync from '../../api/safeAsync.js';
import { groupListSignal } from './store.js';
import { addGroup } from "../../db/tables/groups/services.js"
import { handleTabClick } from "../tab.js"


const instances = {
    groupModal: null,
    groupDialog: null
}

function modalAddGroupBtn() {
    const btn = h("button", {
        class: "button button--compact",
        type: "button",
        "aria-label": "Créez un nouveau groupe",
        style: "width: 100%",
        onClick: () => {
            instances.groupModal?.close();
            instances.groupDialog?.open();
        }
    },
        h("span", { class: "button__content", style: "justify-content: center" },
            h("span", { class: "button__group" },
                h("i", { class: `button__icon--left ${getIcon("add")}`, "aria-hidden": "true" }),
                h("span", { class: "button__label" }, "Créez un groupe")
            )
        )
    );

    const wrapper = h("div", { style: "padding: 10px 30px" }, btn);
    return wrapper;
}

export function createGroupModal() {
    const container = h("nav", { class: "overlay-modal__nav" });

    renderGroupTabs(container, modalAddGroupBtn());

    if (!instances.groupModal) {
        instances.groupModal = createModal({
            title: "Groupes de tâches",
            content: container,
        });
    } else {
        instances.groupModal.update({
            title: "Groupes de tâches",
            content: container
        });
    }

    const closeModal = watchMedia("(min-width: 950px)");
    effect(() => {
        const close = closeModal();
        if (close)
            instances.groupModal?.close();
    });

    return () => {
        instances.groupModal.open();
    };
}

export function createGroupDialog() {
    const groupNameInput = h('input', {
        id: 'group-name',
        class: 'input__field',
        type: 'text',
        placeholder: 'Nom du groupe...',
        'aria-label': 'Nom du groupe',
        'aria-describedby': 'group-name-desc'
    });

    const iconGrid = h('div', { class: 'radio-grid', id: 'group-icon' },
        ...ICONS.map(icon =>
            h('label', { class: 'radio-choice' },
                h('input', {
                    type: 'radio',
                    name: 'icon',
                    value: icon
                }),
                h('span', { class: 'radio-choice__visual' },
                    h('i', {
                        class: getIcon(icon),
                        'aria-hidden': 'true'
                    })
                )
            )
        )
    );

    const colorGrid = h('div', { class: 'radio-grid', id: 'group-color' },
        ...COLORS.map(color =>
            h('label', { class: 'radio-choice' },
                h('input', {
                    type: 'radio',
                    name: 'color',
                    value: color
                }),
                h('span', {
                    class: `radio-choice__visual ${getColor(color)}`,
                    'aria-hidden': 'true'
                })
            )
        )
    );

    const formField = h('section', { class: 'form-field' },
        h('div', { class: 'form-field__header' },
            h('label', { for: 'group-name' }, 'Nom du groupe'),
            h('p', { class: 'form-field__description' }, 'Ce nom sera affiché dans votre tableau de bord.')
        ),
        h('label', { class: 'input input--compact', for: 'group-name' },
            h('span', { class: 'input__content' },
                h('span', { class: 'input__group' }, groupNameInput)
            )
        )
    );

    const content = [
        formField,
        h('section', { class: 'form-field' },
            h('div', { class: 'form-field__header' },
                h('label', { for: 'group-color' }, 'Choisir une couleur'),
                h('p', { class: 'form-field__description' }, 'Cette couleur représentera votre groupe.')
            ),
            colorGrid
        ),
        h('section', { class: 'form-field' },
            h('div', { class: 'form-field__header' },
                h('label', { for: 'group-icon' }, 'Choisir une icône'),
                h('p', { class: 'form-field__description' }, 'Cette icône représentera visuellement votre groupe.')
            ),
            iconGrid
        )
    ];

    function reset() {
        groupNameInput.value = '';
        iconGrid.querySelectorAll('input').forEach(i => i.checked = false);
        colorGrid.querySelectorAll('input').forEach(i => i.checked = false);
        validate.reset();
    }

    const validate = formFieldValidate(formField);

    instances.groupDialog = createDialog({
        title: 'Ajouter un groupe',
        content,
        destroyOnClose: false,
        onOverlayClick: () => {
            instances.groupDialog?.close();
            reset();
        },
        onClose: reset,
        actions: [
            {
                name: "Ajouter",
                variant: "primary-outline",
                onClick: safeAsync(async () => {
                    const name = groupNameInput.value.trim();
                    let icon = iconGrid.querySelector('input[name="icon"]:checked')?.value;
                    let color = colorGrid.querySelector('input[name="color"]:checked')?.value;
                    if (!validate.isValid()) return;
                    let baseKey = generateGroupKey(name);
                    let key = baseKey;
                    let suffix = 1;
                    const existingGroups = groupListSignal();
                    const keys = new Set(existingGroups.map(g => g.key));
                    while (keys.has(key)) key = `${baseKey}${suffix++}`;
                    const newGroup = await addGroup({ key, label: name, icon, color });
                    groupListSignal([...groupListSignal(), newGroup]);
                    toast.success(`Le groupe “${name}” a été créé avec succès.`);
                    reset();
                    instances.groupDialog?.close();
                }, () => {
                    toast.error("Échec lors de la création du groupe.");
                })
            },
            {
                name: "Annuler",
                onClick: () => {
                    reset();
                    instances.groupDialog?.close();
                }
            }
        ],
    });

    return () => {
        instances.groupDialog?.open();
    }
}

export function createGroupTab({ key, label, icon, color }) {
    const li = h("li", {
        "data-tab-type": "group",
        "data-tab-target": key,
        id: `tab-${key}`,
        "aria-controls": `panel-${key}`,
        "aria-selected": "false",
        tabindex: "-1",
        role: "tab",
        onClick: handleTabClick
    },
        h("a", {
            href: `?group=${key}`,
            class: "nav-link",
            onClick: (e) => {
                e.preventDefault();
                instances.groupModal?.close();
            }
        },
            h("i", {
                class: `nav-link--icon ${getIcon(icon)}`,
                "aria-hidden": "true"
            }),
            label,
            h("span", {
                class: `group-color group-color--bullet group-color--${color}`,
                "aria-hidden": "true"
            })
        )
    );
    return li;
}