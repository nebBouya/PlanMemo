import h from "../../api/h.js";
import { ICONS, COLORS, getIcon, getColor } from "../tokens.js";
import { toast } from "../../api/toast.js";
import safeAsync from "../../api/safeAsync.js";
import { formFieldValidate } from "../form-field.js";
import createDialog from "../dialog.js";
import { getGroupByKey, updateGroup, deleteGroup } from '../../db/tables/groups/services.js';
import { groupListSignal } from "../sidebar/store.js";
import TabServices from "../tab.js";
import { generateGroupKey } from "../sidebar/render.js";

export function createUpdateGroupDialog(key) {
    safeAsync(async () => {
        const group = await getGroupByKey(key);
        if (!group) {
            toast.error("Groupe introuvable.");
            return;
        }

        const groupNameInput = h('input', {
            id: 'group-name',
            class: 'input__field',
            type: 'text',
            placeholder: 'Nom du groupe...',
            value: group.label,
            'aria-label': 'Nom du groupe',
            'aria-describedby': 'group-name-desc',
        });

        const iconGrid = h('div', { class: 'radio-grid', id: 'group-icon' },
            ...ICONS.map(icon =>
                h('label', { class: 'radio-choice' },
                    h('input', {
                        type: 'radio',
                        name: 'icon',
                        value: icon,
                        checked: group.icon === icon
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
                        value: color,
                        checked: group.color === color
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

        const validate = formFieldValidate(formField);

        let isClosing = false;
        function confirmClose() {
            if (isClosing) return;
            const nameChanged = groupNameInput.value.trim() !== group.label;
            const iconChanged = iconGrid.querySelector('input[name="icon"]:checked')?.value !== group.icon;
            const colorChanged = colorGrid.querySelector('input[name="color"]:checked')?.value !== group.color;
            const hasChanges = nameChanged || iconChanged || colorChanged;

            if (!hasChanges || window.confirm("Annuler les modifications ?")) {
                isClosing = true;
                dialog.close();
            }
        }

        function reset() {
            groupNameInput.value = group.label;
            iconGrid.querySelectorAll('input').forEach(input => {
                input.checked = input.value === group.icon;
            });
            colorGrid.querySelectorAll('input').forEach(input => {
                input.checked = input.value === group.color;
            });
            validate.reset();
            isClosing = false;
        }

        const dialog = createDialog({
            title: "Modifier le groupe",
            content,
            destroyOnClose: true,
            onOverlayClick: confirmClose,
            onClose: reset,
            actions: [
                {
                    name: "Enregistrer",
                    variant: "primary-outline",
                    onClick: safeAsync(async () => {
                        const newName = groupNameInput.value.trim();
                        const newIcon = iconGrid.querySelector('input[name="icon"]:checked')?.value || group.icon;
                        const newColor = colorGrid.querySelector('input[name="color"]:checked')?.value || group.color;

                        if (!validate.isValid()) return;

                        const existingGroups = groupListSignal();
                        const keys = new Set(existingGroups.map(g => g.key));

                        let newKey = group.key;

                        const nameChanged = newName !== group.label;

                        if (nameChanged) {
                            const baseKey = generateGroupKey(newName);
                            newKey = baseKey;
                            let suffix = 1;

                            while (keys.has(newKey) && newKey !== group.key) {
                                newKey = `${baseKey}${suffix++}`;
                            }
                        }

                        const updated = await updateGroup(group.id, {
                            ...group,
                            key: newKey,
                            label: newName,
                            icon: newIcon,
                            color: newColor
                        });

                        if (newKey !== group.key) {
                            TabServices.setGroup(updated.key);
                            groupListSignal(groupListSignal().filter(g => g.key !== group.key));
                            groupListSignal([...groupListSignal(), updated]);
                        } else {
                            groupListSignal(groupListSignal().map(g => g.key === group.key ? updated : g));
                            TabServices.setGroup(updated.key);
                        }

                        toast.success(`Groupe “${newName}” mis à jour avec succès.`);
                        dialog.close();
                    }, () => {
                        toast.error("Échec lors de la mise à jour du groupe.");
                    })
                },
                {
                    name: "Supprimer",
                    variant: "error-outline",
                    onClick: safeAsync(async () => {
                        const confirmDelete = window.confirm("Supprimer ce groupe ? Cette action est irréversible.");
                        if (!confirmDelete) return;

                        await deleteGroup(group.id);
                        TabServices.setView("dashboard");
                        groupListSignal(groupListSignal().filter(g => g.key !== group.key));
                        toast.success("Groupe supprimé.");
                        dialog.close();

                    })
                },
                {
                    name: "Annuler",
                    onClick: confirmClose
                }
            ]
        });

        dialog.open();

    }, () => {
        toast.error("Impossible de charger le groupe.");
    })();
}