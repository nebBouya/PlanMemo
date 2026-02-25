import { isType } from "../utils/general.js";

function generateTimestamp() {
    return Math.round((Date.now() + performance.now()) * 100);
}

export function isValidUUID(uuid) {
    return isType(uuid, "string") && UUID_REGEX.test(uuid);
}

const HEX_LOOKUP = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(-2));
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateRandomBytes(size) {
    const arr = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
}

function generateUUID(timestamp) {
    const randomBytes = crypto.getRandomValues
        ? crypto.getRandomValues(new Uint8Array(10))
        : generateRandomBytes(10);
    randomBytes[0] = (randomBytes[0] & 0x0f) | 0x40;
    randomBytes[2] = (randomBytes[2] & 0x3f) | 0x80;
    const uuid = `${timestamp.toString().slice(0, 8)}-${timestamp.toString().slice(8, 12)}-${HEX_LOOKUP[randomBytes[0]]}${HEX_LOOKUP[randomBytes[1]]}-` +
        `${HEX_LOOKUP[randomBytes[2]]}${HEX_LOOKUP[randomBytes[3]]}-${HEX_LOOKUP[randomBytes[4]]}${HEX_LOOKUP[randomBytes[5]]}` +
        `${HEX_LOOKUP[randomBytes[6]]}${HEX_LOOKUP[randomBytes[7]]}${HEX_LOOKUP[randomBytes[8]]}${HEX_LOOKUP[randomBytes[9]]}`.toLowerCase();
    if (!UUID_REGEX.test(uuid)) throw new TypeError("Generated UUID is invalid.");
    return uuid;
}

export default function UUID() {
    return generateUUID(generateTimestamp());
}
