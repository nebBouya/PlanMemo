export function attachOutsideListener(wrapper, isOpen, callback, options = {}) {
    const { listenBlur = false } = options;

    function handleClick(e) {
        if (!isOpen() || wrapper.contains(e.target)) return;
        callback(e);
    }

    function handleBlur(e) {
        if (!isOpen()) return;
        callback(e);
    }

    document.addEventListener("click", handleClick);
    if (listenBlur) window.addEventListener("blur", handleBlur);

    return function destroy() {
        document.removeEventListener("click", handleClick);
        if (listenBlur) window.removeEventListener("blur", handleBlur);
    };
}