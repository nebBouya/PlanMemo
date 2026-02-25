import { isType } from "../utils/general.js";
import { capitalize } from "../utils/string.js";

export const ICONS = [
    "airplane",
    "book",
    "book-2",
    "box",
    "bomb",
    "briefcase",
    "bus",
    "calendar",
    "cat",
    "chef-hat",
    "code",
    "delivery",
    "email",
    "fire",
    "gamepad-old",
    "gamepad",
    "health",
    "health-2",
    "health-3",
    "heart",
    "inbox",
    "incognito",
    "map-point",
    "map",
    "gallery",
    "leaf", "buildings",
    "buildings-2",
    "buildings-3",
    "confetti",
    "cosmetic",
    "corkscrew",
    "cup",
    "color",
    "database",
    "electric-refueling",
    "donut-bitten",
    "donut",
    "ghost-smile",
    "ghost",
    "gas",
    "hanger",
    "hanger-2",
    "ladle",
    "home-2",
    "help",
    "magic-stick",
    "magic-stick-2",
    "magic-stick-3",
    "magnet",
    "mask-happy",
    "mask-sad",
    "masks",
    "palette",
    "palette-2",
    "palette-round",
    "perfume",
    "paw",
    "scooter",
];

export const ALL_ICONS = [...ICONS,
    "add",
    "bell",
    "check",
    "chevron-up",
    "chevron-down",
    "chevron-left",
    "chevron-right",
    "chevron-left",
    "chevron-h",
    "chevron-v",
    "dots",
    "edit",
    "expand",
    "clock",
    "close",
    "danger",
    "up-arrow",
    "down-arrow",
    "file-download",
    "file-send",
    "home",
    "info",
    "pause",
    "play",
    "maximize",
    "minimize",
    "waves",
    "cup-hot",
    "airplane-2",
    "cloud-rain",
    "quit-pip",
    "to-pip",
    "remove",
    "search",
    "send",
    "update",
    "notes",
    "danger",
    "settings"];

export function isValidIcon(name) {
    name = name.trim().toLowerCase();
    return ALL_ICONS.includes(name);
}

export function getIcon(name) {
    return isValidIcon(name) ? `icon icon--${name}` : "icon icon--danger"
}

export const COLORS = [
    "red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "maroon", "gold", "gray", "skin-pink"
];

export function isValidColor(name) {
    name = name.trim().toLowerCase();
    return COLORS.includes(name);
}

export function getColor(name) {
    return isValidColor(name) ? `group-color group-color--${name}` : "group-color group-color--gray"
}

export const NOTE_COLORS = [
    "almond", "mint", "honey", "lavender", "sky", "rose", "pistachio", "apricot", "periwinkle"
];

export function isValidNoteColor(name) {
    name = name.trim().toLowerCase();
    return NOTE_COLORS.includes(name);
}

export function getNoteColor(name) {
    return isValidNoteColor(name) ? `note-color--${name}` : "note-color--almond"
}

export function splitDate(dateInput) {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function normalizeDate(date) {
    if (isType(date, "date")) return formatDateSmart(date);
    else if (isType(date, "string")) return formatDateSmart(new Date(date));
    throw new TypeError("date should be either a ISO string or date object");
}

export function formatDateSmart(date) {
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();

    const options = {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        ...(isCurrentYear ? {} : { year: 'numeric' })
    };

    return capitalize(date.toLocaleDateString("fr-FR", options));
}

export function getCurrentDate() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    return `${yyyy}-${mm}-${dd}`;
}

export function truncateText(text, max = 100) {
    return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export function areArraysEqual(a = [], b = [], comparator = (x, y) => x === y) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (!comparator(a[i], b[i])) return false;
    }
    return true;
}