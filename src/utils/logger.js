import Config from "../api/config.js";

class Logger {
    #baseStyle;
    #colors;
    #debugMode;

    constructor(debug = true, appName = "_X-X_") {
        this.#debugMode = debug;
        this.appName = appName;
        this.#baseStyle = `
            padding: 2px 5px;
            border-radius: 4px;
            color: white;
        `;

        this.#colors = {
            log: "#124F5C",
            error: "#ed2939",
            warn: "#f39c12",
        };
    }

    #print(type, message, ...others) {
        if (this.#debugMode) {
            const style = `${this.#baseStyle} background-color: ${this.#colors[type]}`;
            console[type](`%c${this.appName}`, style, message, ...others);
        }
    }

    log(message, ...others) {
        this.#print("log", message, ...others);
    }

    error(message, ...others) {
        this.#print("error", message, ...others);
    }

    warn(message, ...others) {
        this.#print("warn", message, ...others);
    }
    static instance = new Logger(Config.debug, Config.appName);
}

export default Logger.instance;