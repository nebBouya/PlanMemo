import logger from "../utils/logger.js";

export default function safeAsync(fn, onError = () => { }) {
    return function (...args) {
        Promise.resolve(fn(...args)).catch((err) => {
            logger.error(err);
            onError(err);
        });
    };
}