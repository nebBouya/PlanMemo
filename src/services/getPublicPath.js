export function getSoundPath(src) {
    const base = getPublicPath() + "/sounds";
    if (src) return base + `/${src}`;
    return base;
}

export function getVideoPath(src) {
    const base = getPublicPath() + "/videos";
    if (src) return base + `/${src}`;
    return base;
}
export function getImagePath(src) {
    const base = getPublicPath() + "/images";
    if (src) return base + `/${src}`;
    return base;
}

export default function getPublicPath() {
    return `${window.location.origin}/public`;
}