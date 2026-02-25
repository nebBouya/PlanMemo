import h from "../../../api/h.js";
import { getImagePath, getVideoPath } from "../../getPublicPath.js";

let backgroundVideoElement = null;

export function onUserInteraction() {
    if (backgroundVideoElement) {
        backgroundVideoElement.play().catch((err) => {
            console.log({ err })
        });
    }
}


export function renderBackground({ type, value }) {
    if (type === "video") {
        const el = h("video", {
            autoplay: true,
            muted: true,
            loop: true,
            playsInline: true,
            class: "pomodoro-screen__background--item"
        },
            h("source", {
                src: getVideoPath(`pomodoro/${value} hd.mp4`),
                type: "video/mp4",
                media: "(min-width: 768px)"
            }),
            h("source", {
                src: getVideoPath(`pomodoro/${value} sd.mp4`),
                type: "video/mp4"
            })
        );
        backgroundVideoElement = el;
        return el;
    }

    if (type === "image") {
        return h("picture", {},
            h("source", {
                srcset: getImagePath(`pomodoro/background/${value} hd.jpg`),
                media: "(min-width: 768px)"
            }),
            h("img", {
                class: "pomodoro-screen__background--item",
                src: getImagePath(`pomodoro/background/${value} sd.jpg`),
                alt: "Image de fond Pomodoro"
            })
        );
    }

    return h("div", {
        class: `pomodoro-screen__background--item pomodoro-gradient--${value}`
    });
}