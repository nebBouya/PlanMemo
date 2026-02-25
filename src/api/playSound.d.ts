import { Signal } from "./signals";

type PlayOptions =
    | {
        persistent?: boolean;
        loop?: false;
        duration: number;
        volume?: number;
    }
    | {
        persistent?: boolean;
        loop: true;
        volume?: number;
    };

interface PushOptions {
    src: string;
    duration: number;
    shouldAutoResume?: boolean;
    volume?: number;
}

interface ReplaceOptions extends Omit<PlayOptions, "persistent"> {
    persistent?: boolean | "auto";
}

declare class SoundPlayer {
    readonly state: {
        readonly isPlaying: Signal<boolean>;
        readonly isLocked: boolean | undefined;
        readonly wasPlaying: boolean | undefined;
    }

    play(src: string, options?: PlayOptions): void;
    push(options: PushOptions): void;
    playSampleSmart(options: PushOptions): void;
    stop(): void;
    resume(): void;
    setVolume(volume: number): void;
    fresh(): void;
    replace(src: string, options?: ReplaceOptions): void;
    clearSamples(): void;
}

declare const instance: SoundPlayer;
export default instance;
