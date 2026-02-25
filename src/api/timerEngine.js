import { signal, computed, effect } from "./signals.js";
import soundPlayer from "./playSound.js";
import { BACKGROUND_SOUND_ICONS, FIXED_SESSION_PLANS, pomodoroSettings, pomodoroTaskSelection, pomodoroBackgroundSound, promodoroAbmbientSoundLevel } from "../services/pomodoro/store.js";
import safeAsync from "./safeAsync.js";
import { updateTask } from "../db/tables/tasks/services.js";
import { toast } from "./toast.js";
import { refreshVisibleTaskSignal } from "../services/refreshTasksView.js";

function parseDuration(str) {
    if (!str || str === "auto") return null;
    if (str.endsWith("m")) return parseInt(str) * 60;
    if (str.endsWith("h")) return parseInt(str) * 3600;
    return null;
}

function computeCustomPlan(totalTime, focusTime, breakTime, skipBreaks) {
    const DEFAULT_FOCUS = 900;
    const DEFAULT_BREAK = 300;
    const MIN_FOCUS = 180;
    const MIN_BREAK = 120;

    const plan = [];
    let used = 0;

    const focusDur = focusTime ?? DEFAULT_FOCUS;
    const breakDur = breakTime ?? DEFAULT_BREAK;

    if (totalTime < MIN_FOCUS) return [];

    while (true) {
        if (used + focusDur > totalTime) break;
        plan.push({ type: "focus", duration: focusDur });
        used += focusDur;

        if (skipBreaks) continue;

        if (used + breakDur > totalTime) break;
        plan.push({ type: "break", duration: breakDur });
        used += breakDur;
    }

    const leftover = totalTime - used;
    const focusSessions = plan.filter(p => p.type === "focus");
    const breakSessions = plan.filter(p => p.type === "break");

    if (leftover <= 0 || focusSessions.length === 0) return plan;

    if (skipBreaks) {
        const extraPerFocus = Math.floor(leftover / focusSessions.length);
        for (let p of plan) {
            if (p.type === "focus") p.duration += extraPerFocus;
        }
    } else {
        const half = Math.floor(leftover / 2);
        const extraPerFocus = Math.floor(half / focusSessions.length);
        const remainingForBreak = leftover - (extraPerFocus * focusSessions.length);

        for (let p of plan) {
            if (p.type === "focus") p.duration += extraPerFocus;
        }

        if (breakSessions.length > 0) {
            breakSessions[breakSessions.length - 1].duration += remainingForBreak;
        } else if (remainingForBreak >= MIN_BREAK) {
            plan.push({ type: "break", duration: remainingForBreak });
        }
    }

    return plan;
}


export class PomodoroTimer {
    static MIN_TIME = 1200;
    static MAX_TIME = 14400;

    #isRunning = signal(false);
    #isPaused = signal(false);
    #isBreak = signal(false);
    #iteration = signal(0);
    #playingTaskId = signal(null);
    #currentTime = signal(0);
    #totalDuration = signal(0);
    #workingTime = signal(3600);
    #skipBreaks = signal(false);
    #sessionPlan = signal([]);
    #timerInterval = null;
    #awaitingManualFinish = signal(false);

    #progress = computed(() => {
        const total = this.#totalDuration();
        const current = this.#currentTime();
        return typeof total === "number" && total > 0
            ? Math.floor((1 - current / total) * 100)
            : 0;
    });

    #planMeta = signal({
        focusCount: 0,
        breakCount: 0,
        breakSkipped: false,
        reason: ""
    });

    #canIncrease = computed(() => this.#workingTime() < PomodoroTimer.MAX_TIME);
    #canDecrease = computed(() => this.#workingTime() > PomodoroTimer.MIN_TIME);
    #playTimeVolume = computed(() => promodoroAbmbientSoundLevel() / 100);

    constructor() {

    }

    safeInit() {
        effect(() => {
            pomodoroSettings();
            this.#workingTime();
            this.#skipBreaks();
            if (!this.#isRunning()) {
                this.#computePlan();
            }
        });
    }

    #computePlan() {
        const settings = pomodoroSettings();
        const total = this.#workingTime();
        const skip = this.#skipBreaks();

        const focusDur = parseDuration(settings.focusDuration);
        const breakDur = parseDuration(settings.breakDuration);

        let plan = [];
        let skippedBreakTime = 0;
        let didSkipBreaks = false;

        if (settings.focusDuration === "auto" && FIXED_SESSION_PLANS[total]) {
            const preset = FIXED_SESSION_PLANS[total];
            plan = [];
            for (let i = 0; i < preset.length; i++) {
                const type = i % 2 === 1 ? "break" : "focus";
                const duration = preset[i];
                if (type === "break" && skip) {
                    skippedBreakTime += duration;
                    didSkipBreaks = true;
                    continue;
                }
                plan.push({ type, duration: duration });
            }
            if (didSkipBreaks) {
                const focusSessions = plan.filter(s => s.type === "focus");
                const extra = Math.floor(skippedBreakTime / focusSessions.length);
                const remainder = skippedBreakTime % focusSessions.length;

                let distributed = 0;
                for (const session of plan) {
                    if (session.type !== "focus") continue;
                    session.duration += extra;
                    if (distributed < remainder) {
                        session.duration += 1;
                        distributed++;
                    }
                }
                skippedBreakTime = 0;
                didSkipBreaks = false;
            }
        } else {
            plan = computeCustomPlan(total, focusDur, breakDur, skip);
        }

        const focusCount = plan.filter(s => s.type === "focus").length;
        const breakCount = plan.filter(s => s.type === "break").length;

        const breaksPresent = breakCount > 0;
        const breakSkipped = skip || !breaksPresent;

        if (plan.length === 0) {
            plan = [{ type: "focus", duration: total }];
        }

        let reason = null;
        if (plan.length === 1 && plan[0].type === "focus") {
            reason = total < 2 * (focusDur ?? 900) ? "short_time_single_focus" : "only_one_focus";
        } else if (breakSkipped) {
            reason = "breaks_skipped";
        }

        this.#planMeta({
            focusCount,
            breakCount,
            breakSkipped,
            reason
        });

        this.#sessionPlan(plan);
    }

    start(taskId = null) {
        if (this.#isRunning()) return;
        this.#computePlan();

        if (this.#sessionPlan().length === 0) {
            toast.error("La durée de travail est trop courte pour générer un plan Pomodoro valide.");
            return;
        }

        this.#iteration(1);
        this.#playingTaskId(taskId);
        this.#runSession();
    }

    #runSession() {
        const plan = this.#sessionPlan();
        const index = this.#iteration() - 1;
        const current = plan[index];
        if (!current || typeof current.duration !== "number") return;

        this.#isBreak(current.type === "break");
        this.#currentTime(current.duration);
        this.#totalDuration(current.duration);
        this.#isPaused(false);
        this.#isRunning(true);

        if (current.type === "focus") this.playAmbient();
        this.tick();
        this.#timerInterval = setInterval(() => this.tick(), 1000);
    }

    tick() {
        if (!this.#isRunning() || this.#isPaused()) return;
        const t = this.#currentTime();
        this.#currentTime(t - 1);
        if (this.#currentTime() <= 0) this.#endSession();
    }

    #endSession() {
        soundPlayer.clearSamples();
        this.playEndSound();
        clearInterval(this.#timerInterval);
        this.#timerInterval = null;

        const next = this.#iteration() + 1;
        if (next > this.#sessionPlan().length) {
            if (this.#playingTaskId()) {
                if (pomodoroTaskSelection().autoFinishTask) {
                    this.finishManually();
                } else {
                    this.#isPaused(true);
                    this.#isRunning(false);
                    this.#awaitingManualFinish(true);
                    this.#currentTime(0);
                }
                return;
            }
            this.reset();
            return;
        }

        this.#iteration(next);
        this.#runSession();
    }

    pause() {
        if (!this.#isRunning() || this.#isPaused()) return;
        this.#isPaused(true);
        this.#isRunning(false);
        clearInterval(this.#timerInterval);
        this.#timerInterval = null;
        soundPlayer.stop();
    }

    resume() {
        if (this.#isRunning() || !this.#isPaused()) return;
        this.#isPaused(false);
        this.#isRunning(true);
        this.#timerInterval = setInterval(() => this.tick(), 1000);
        soundPlayer.resume();
    }

    reset() {
        clearInterval(this.#timerInterval);
        this.#timerInterval = null;
        this.#isRunning(false);
        this.#isPaused(false);
        this.#iteration(0);
        this.#playingTaskId(null);
        this.#currentTime(0);
        this.#totalDuration(0);
        this.#awaitingManualFinish(false);
        soundPlayer.fresh();
    }

    finishManually() {
        const taskId = this.#playingTaskId();
        if (!taskId) return;

        safeAsync(async () => {
            await updateTask(taskId, { status: "done" });
            await refreshVisibleTaskSignal();
        }, () => toast.error("Impossible de marquer la tâche comme terminée"))();

        this.reset();
    }

    cancel() {
        this.reset();
    }

    incrementWorkingTime() {
        const current = this.#workingTime();
        if (current < PomodoroTimer.MAX_TIME) {
            this.#workingTime(current + 300);
        }
    }

    decrementWorkingTime() {
        const current = this.#workingTime();
        if (current > PomodoroTimer.MIN_TIME) {
            this.#workingTime(current - 300);
        }
    }

    setWorkingTime(seconds) {
        const clamped = Math.max(PomodoroTimer.MIN_TIME, Math.min(PomodoroTimer.MAX_TIME, seconds));
        this.#workingTime(clamped);
    }

    setSkipBreaks(val) {
        this.#skipBreaks(Boolean(val));
    }

    playAmbient() {
        const src = pomodoroBackgroundSound();
        if (!src || src === "remove") return;
        const volume = this.#playTimeVolume();
        soundPlayer.play(BACKGROUND_SOUND_ICONS[src], {
            persistent: true,
            loop: true,
            volume
        });
        effect(() => {
            const newVolume = this.#playTimeVolume();
            const isPlaying = soundPlayer.state.isPlaying();
            const isRunning = this.#isRunning();
            if (isPlaying && isRunning) {
                soundPlayer.setVolume(newVolume);
            }
        });
    }

    playEndSound() {
        const settings = pomodoroSettings();
        const isBreak = this.#isBreak();
        const enabled = isBreak ? settings.breakSoundEnabled : settings.focusSoundEnabled;
        const src = isBreak ? settings.breakSound : settings.focusSound;
        if (!enabled || !src) return;
        soundPlayer.playSampleSmart({
            src,
            duration: 2500,
            volume: 0.8
        });

    }

    get state() {
        const _this = this;
        return {
            get isRunning() { return _this.#isRunning },
            get isPaused() { return _this.#isPaused },
            get isBreak() { return _this.#isBreak },
            get currentTime() { return _this.#currentTime },
            get totalDuration() { return _this.#totalDuration },
            get iteration() { return _this.#iteration },
            get playingTaskId() { return _this.#playingTaskId },
            get progress() { return _this.#progress },
            get sessionPlan() { return _this.#sessionPlan },
            get workingTime() { return _this.#workingTime },
            get canIncrease() { return _this.#canIncrease },
            get canDecrease() { return _this.#canDecrease },
            get skipBreaks() { return _this.#skipBreaks },
            get planMeta() { return _this.#planMeta },
            get awaitingManualFinish() { return _this.#awaitingManualFinish }
        };
    }
}
