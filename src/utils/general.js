export function type(v) {
    return Object.prototype.toString.call(v).split(" ")[1].slice(0, -1).toLowerCase();
}

export function isType(v, ...types) {
    return types.some(t => t.toLowerCase() === type(v));
}

export function isNullable(v) {
    return isType(v, "null", "undefined");
}

export function isIterable(v) {
    return !isNullable(v) && typeof v[Symbol.iterator] === "function";
}

export function flipNumSign(num) {
    if (!isType(num, "number")) throw new TypeError("Cannot flip a value that it's not a number");
    if (num < 0) return Math.abs(num);
    return 0 - num;
}