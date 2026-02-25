import { isType } from "./general.js";

export function updateObj(target, ...sources) {
    if (!isType(target, "object")) throw new TypeError("Target must be an object");
    for (const source of sources) {
        if (!isType(source, "object")) continue;
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const value = source[key];
                if (isType(value, "object")) {
                    target[key] = target[key] ?? {};
                    updateObj(target[key], value);
                } else {
                    target[key] = value;
                }
            }
        }
    }
    return target;
}

export function isObjSubset(parentObj, childObj) {
    if (!isType(parentObj, "object") || !isType(childObj, "object")) throw new TypeError("Both arguments must be objects.");
    return Object.keys(childObj).every(key => {
        const childValue = childObj[key];
        const parentValue = parentObj[key];
        if (isType(childValue, "object")) {
            return isObjSubset(parentValue, childValue);
        }
        return childValue === parentValue;
    });
}