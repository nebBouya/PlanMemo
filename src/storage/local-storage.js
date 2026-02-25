import logger from "../utils/logger.js";

class LocalStorage {
    #storage = (() => {
        try {
            if ("localStorage" in window && window.localStorage) {
                return window.localStorage;
            }
        } catch (err) {
            logger.warn("localStorage not available, using fallback.", err);
        }
        let memoryStore = new Map();
        return {
            getItem: key => memoryStore.get(key) || null,
            setItem: (key, value) => memoryStore.set(key, value),
            removeItem: key => memoryStore.delete(key),
            clear: () => memoryStore.clear(),
            key: index => Array.from(memoryStore.keys())[index] || null,
            get length() { return memoryStore.size; }
        };
    })();

    #constraints = new Map();
    #eventMap = new Map();

    constructor() {
        if (LocalStorage._instance) return LocalStorage._instance;
        LocalStorage._instance = this;
        window.addEventListener("storage", (event) => {
            const callbacks = this.#eventMap.get(event.key);
            const { isValueAllowed } = this.#evaluateConstraints(event.key);
            try {
                const newValue = JSON.parse(event.newValue);
                const oldValue = JSON.parse(event.oldValue);
                if (!isValueAllowed(newValue)) {
                    this.#storage.setItem(event.key, event.oldValue);
                    return;
                }
                callbacks?.forEach(cb => cb(newValue, oldValue));
            } catch (err) {
                logger.error(err);
            }
        });
    }

    #evaluateConstraints(key) {
        const rules = this.#constraints.get(key);
        return {
            isValueAllowed: (value) => {
                if (!rules) return true;
                if (rules instanceof Set) return rules.has(value);
                return true;
            }
        };
    }

    initKey(key, { constraint, default: defaultValue }) {
        if (constraint && Array.isArray(constraint)) {
            this.#constraints.set(key, new Set(constraint));
        } else {
            this.#constraints.set(key, null);
        }

        const currentValue = this.read(key);
        const { isValueAllowed } = this.#evaluateConstraints(key);

        if (currentValue === null || !isValueAllowed(currentValue)) {
            const valueToStore = isValueAllowed(defaultValue) ? defaultValue : (constraint?.[0] ?? null);
            this.write(key, valueToStore);
        }
    }

    read(key, fallback = null) {
        try {
            const raw = this.#storage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    write(key, value) {
        const { isValueAllowed } = this.#evaluateConstraints(key);
        if (!isValueAllowed(value)) return;
        const oldValue = this.read(key);
        this.#storage.setItem(key, JSON.stringify(value));
        this.#eventMap.get(key)?.forEach(cb => cb(value, oldValue));
    }

    remove(key) {
        this.#storage.removeItem(key);
        this.#constraints.delete(key);
        this.#eventMap.delete(key);
    }

    clear() {
        this.#storage.clear();
        this.#constraints.clear();
        this.#eventMap.clear();
    }

    watch(key, callback) {
        if (!this.#eventMap.has(key)) {
            this.#eventMap.set(key, new Set());
        }
        this.#eventMap.get(key).add(callback);
    }
}

const instance = new LocalStorage();
export default instance;