import { getSoundPath } from "../services/getPublicPath.js";
import logger from "../utils/logger.js";
import { signal } from "./signals.js";

async function loopAudioSeamlessly(url, volume = 0.8) {
    const ctx = new AudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode).connect(ctx.destination);
    source.start(0);

    return { source, ctx, gainNode };
}

class SoundPlayer {
    #defaultAudio;
    #presistentAudio;
    #pushedAudio;
    #isLocked;
    #pausedAudio;
    #timeoutId;
    #wasPlaying;
    #shouldResumeOnClear;
    #webAudio = null;
    #isPlaying = signal(false);



    constructor() {
        if (SoundPlayer._instance) return SoundPlayer._instance;
        SoundPlayer._instance = this;

        this.#defaultAudio = null;
        this.#presistentAudio = null;
        this.#pushedAudio = null;
        this.#isLocked = false;
        this.#pausedAudio = null;
        this.#timeoutId = null;
        this.#wasPlaying = false;
        this.#shouldResumeOnClear = false;
        this.#isPlaying(false);

    }

    async play(src, { persistent = false, loop = false, duration = null, volume = 0.8 } = {}) {
        if (!src) return;

        if (this.#timeoutId) {
            clearTimeout(this.#timeoutId);
            this.#timeoutId = null;
        }

        if (this.#isLocked && persistent) {
            logger.warn("SoundPlayer is locked. Cannot play new persistent audio.");
            return;
        }

        if (loop && persistent) {
            this.#disposeWebAudio();
            try {
                this.#webAudio = await loopAudioSeamlessly(getSoundPath(src), volume);
                this.#isLocked = true;
                this.#wasPlaying = true;
                this.#isPlaying(true);
            } catch (err) {
                logger.error("Failed to loop audio seamlessly:", err);
                this.#isPlaying(false);
            }
            return;
        }

        const audio = new Audio(getSoundPath(src));
        audio.volume = volume;
        audio.loop = loop;

        if (persistent) {
            this.#disposePresistent();
            this.#presistentAudio = audio;
            this.#isLocked = true;
        } else {
            this.#disposeDefault();
            this.#defaultAudio = audio;
        }

        audio.play().then(() => {
            this.#wasPlaying = true;
            this.#isPlaying(true);
        }).catch(err => {
            logger.error("Failed to play sound:", err);
            this.#isPlaying(false);
        });

        if (duration !== null && !loop) {
            this.#timeoutId = setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                if (persistent) {
                    this.#disposePresistent();
                } else {
                    this.#disposeDefault();
                    this.#defaultAudio = null;
                }
                this.#timeoutId = null;
                this.#isPlaying(false);
                this.#wasPlaying = false;
            }, duration);
        }
    }

    push({ src, duration, shouldAutoResume = true, volume = 0.8 }) {
        if (!this.#isLocked || !this.#presistentAudio) {
            logger.warn("No locked audio to push from.");
            return;
        }

        this.#shouldResumeOnClear = !this.#presistentAudio.paused && shouldAutoResume;
        this.#presistentAudio.pause();
        this.#pausedAudio = this.#presistentAudio;

        if (this.#pushedAudio) {
            this.#pushedAudio.pause();
            this.#pushedAudio.currentTime = 0;
            this.#pushedAudio = null;
            if (this.#timeoutId) {
                clearTimeout(this.#timeoutId);
                this.#timeoutId = null;
            }
        }

        const pushedAudio = new Audio(getSoundPath(src));
        pushedAudio.volume = volume;
        this.#pushedAudio = pushedAudio;

        pushedAudio.play().then(() => {
            this.#wasPlaying = true;
        }).catch(err => {
            logger.error("Failed to play pushed sound:", err);
        });

        this.#timeoutId = setTimeout(() => {
            pushedAudio.pause();
            pushedAudio.currentTime = 0;
            this.#pushedAudio = null;

            if (shouldAutoResume && this.#pausedAudio) {
                this.#pausedAudio.play().catch(err => {
                    logger.error("Failed to resume persistent audio:", err);
                });
            }

            this.#pausedAudio = null;
            this.#timeoutId = null;
            this.#wasPlaying = false;
        }, duration);
    }

    playSampleSmart({ src, duration, volume = 0.8, shouldAutoResume = true }) {
        if (this.#isLocked && this.#presistentAudio) {
            this.push({ src, duration, volume, shouldAutoResume });
        } else {
            this.play(src, { persistent: false, duration, volume });
        }
    }

    stop() {
        if (!this.#isLocked || !this.#presistentAudio) return;
        this.#presistentAudio.pause();
        this.#wasPlaying = false;
        this.#isPlaying(false);
    }

    resume() {
        if (!this.#isLocked || !this.#presistentAudio) return;
        this.#presistentAudio.play().then(() => {
            this.#isPlaying(true);
        }).catch(err => {
            this.#isPlaying(false);
            logger.error("Failed to resume persistent audio:", err);
        });
        this.#wasPlaying = true;
    }

    setVolume(volume) {
        if (this.#webAudio) {
            this.#webAudio.gainNode.gain.value = volume;
        }
        if (this.#presistentAudio) {
            this.#presistentAudio.volume = volume;
        }
        if (this.#defaultAudio) {
            this.#defaultAudio.volume = volume;
        }
    }

    clearSamples() {
        if (this.#pushedAudio) {
            if (this.#timeoutId) {
                clearTimeout(this.#timeoutId);
                this.#timeoutId = null;
            }

            this.#pushedAudio.pause();
            this.#pushedAudio.currentTime = 0;
            this.#pushedAudio = null;

            if (this.#shouldResumeOnClear && this.#pausedAudio) {
                this.#pausedAudio.play().catch(err => {
                    logger.error("Failed to resume persistent audio:", err);
                });
            }

            this.#pausedAudio = null;
            this.#shouldResumeOnClear = false;
            this.#wasPlaying = this.#shouldResumeOnClear;
            return;
        }
        if (this.#defaultAudio) {
            this.fresh();
        }
    }

    fresh() {
        this.#isPlaying(false);
        this.#disposeDefault();
        this.#disposePresistent();
        this.#disposeWebAudio();
        if (this.#timeoutId) clearTimeout(this.#timeoutId);
        this.#timeoutId = null;
        this.#pausedAudio = null;
        this.#isLocked = false;
        this.#wasPlaying = false;
        this.#shouldResumeOnClear = false;
    }

    replace(src, { persistent = "auto", loop = false, volume = 0.8 } = {}) {
        if (persistent === "auto") persistent = this.#isLocked;
        this.fresh();
        this.play(src, { persistent, loop, volume });
    }

    get state() {
        const _this = this;
        return {
            get isPlaying() { return _this.#isPlaying },
            get isLocked() { return _this.#isLocked },
            get wasPlaying() { return _this.#wasPlaying }
        }
    }

    #disposeWebAudio() {
        if (this.#webAudio) {
            try {
                this.#webAudio.source.stop(0);
                this.#webAudio.ctx.close();
            } catch (err) {
                logger.warn("Failed to stop Web Audio:", err);
            }
            this.#webAudio = null;
        }
    }

    #disposePresistent() {
        if (this.#presistentAudio) {
            this.#presistentAudio.pause();
            this.#presistentAudio.currentTime = 0;
            this.#presistentAudio = null;
            this.#isLocked = false;
        }
    }

    #disposeDefault() {
        if (this.#defaultAudio) {
            this.#defaultAudio.pause();
            this.#defaultAudio.currentTime = 0;
            this.#defaultAudio = null;
        }
    }
}

const instance = new SoundPlayer();
export default instance;