import { signal } from "../api/signals.js";

export default function watchMedia(query) {
    const matchMedia = window.matchMedia(query);
    const state = signal(matchMedia.matches);

    matchMedia.addEventListener('change', (e) => {
        state(e.matches);
    });

    return state;
}