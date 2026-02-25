import { signal, computed } from "../../api/signals.js";
import { PomodoroTimer } from "../../api/timerEngine.js";
import { bindSettingToSignal } from "../effectTools.js";

export const pomodoroTaskSelection = signal({
    unshedualed: false,
    today: true,
    autoFinishTask: true
});

export const pomodoroBackground = signal({
    type: "gradient",
    value: "black"
});

export const pomodoroBackgroundSound = signal("remove");

export const promodoroAbmbientSoundLevel = signal(50);

export const pomodoroTimer = new PomodoroTimer();

export const pomodoroSettings = signal({
    focusDuration: "auto",
    breakDuration: "5m",
    focusSoundEnabled: true,
    breakSoundEnabled: true,
    focusSound: "not-fc-1.mp3",
    breakSound: "not-br-1.mp3"
});

export const fullPomodoroSettings = computed(() => ({
    ...pomodoroSettings(),
    backgroundSound: pomodoroBackgroundSound(),
    pomodoroBackground: pomodoroBackground(),
    taskSelection: pomodoroTaskSelection()
}));

export const SAMPLE_DURATION = {
    notification: 2500,
    background: 8000
}

export const FOCUS_DURATIONS = [
    { content: "Automatique", value: "auto", label: "Durée automatique selon la tâche" },
    { content: "10 min", value: "10m", label: "10 minutes de concentration" },
    { content: "15 min", value: "15m", label: "15 minutes de concentration" },
    { content: "20 min", value: "20m", label: "20 minutes de concentration" },
    { content: "30 min", value: "30m", label: "30 minutes de concentration" },
    { content: "35 min", value: "35m", label: "35 minutes de concentration" },
    { content: "40 min", value: "40m", label: "40 minutes de concentration" },
    { content: "45 min", value: "45m", label: "45 minutes de concentration" },
    { content: "1 heure", value: "1h", label: "1 heure de concentration" }
];

export const BREAK_DURATIONS = [
    { content: "5 min", value: "5m", label: "5 minutes de pause" },
    { content: "10 min", value: "10m", label: "10 minutes de pause" },
    { content: "15 min", value: "15m", label: "15 minutes de pause" }
];

export const FIXED_SESSION_PLANS = {
    1200: [420, 360, 420],
    1500: [600, 300, 600],
    1800: [600, 300, 600, 300],
    2100: [600, 300, 600, 300, 300],
    2400: [900, 300, 900, 300],
    2700: [900, 300, 900, 300, 300],
    3000: [900, 300, 900, 300, 600],
    3600: [900, 300, 900, 300, 900, 300],
    4500: [1200, 300, 1200, 300, 1200, 300],
    5400: [1200, 300, 1200, 300, 1200, 300, 600],
    6000: [1500, 300, 1500, 300, 1200, 300, 600],
    7200: [1500, 300, 1500, 600, 1500, 600, 900],
    9000: [1800, 300, 1500, 300, 1500, 600, 1800],
    10800: [1800, 300, 1800, 600, 1800, 600, 1800],
    14400: [1800, 600, 1800, 600, 1800, 600, 1800, 600]
};

export const BACKGROUND_SOUND_ICONS = {
    "remove": "",
    "airplane-2": "airplane_cabine.mp3",
    "cup-hot": "caffe.mp3",
    "book": "exam_hall.mp3",
    "fire": "fire.mp3",
    "leaf": "nature.mp3",
    "cloud-rain": "rain.mp3",
    "waves": "waves.mp3"
};

export const FOCUS_SOUNDS = ["not-fc-1.mp3", "not-fc-2.mp3", "not-fc-3.mp3", "not-fc-4.mp3"];

export const BREAK_SOUNDS = ["not-br-1.mp3", "not-br-2.mp3", "not-br-3.mp3", "not-br-4.mp3"];

export const BACKGROUND_IMAGES = ["img-1", "img-2", "img-3", "img-4"];

export const BACKGROUND_VIDEOS = [
    "vid-1", "vid-2", "vid-3", "vid-4", "vid-5", "vid-6",
    "vid-7", "vid-8", "vid-9", "vid-10", "vid-11"
];

export const BACKGROUND_GRADIENTS = [
    "black", "purple-peach", "crimson-wine", "teal-glow", "aqua-sky",
    "indigo-violet", "ocean-mist", "flamingo-rose", "gray-black", "twilight-glow", "peach-sand"
];

export const STORE_KEYS = {
    prefix: "pomodoro.settings",
    get basic() {
        return `${this.prefix}.basic`;
    },
    get background() {
        return `${this.prefix}.background`;
    },
    get sound() {
        return `${this.prefix}.sound`;
    },
    get taskSelection() {
        return `${this.prefix}.task_selection`;
    },
    get ambientSoundLevel() {
        return `${this.prefix}.ambient_sound_level`;
    },
};



export function initStore() {
    bindSettingToSignal(STORE_KEYS.basic, pomodoroSettings);
    bindSettingToSignal(STORE_KEYS.background, pomodoroBackground);
    bindSettingToSignal(STORE_KEYS.sound, pomodoroBackgroundSound);
    bindSettingToSignal(STORE_KEYS.taskSelection, pomodoroTaskSelection);
}