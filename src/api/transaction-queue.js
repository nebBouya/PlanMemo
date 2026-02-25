export default class TransactionQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async addOperation(operation) {
        return new Promise((resolve, reject) => {
            this.queue.push({ operation, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        const { operation, resolve, reject } = this.queue.shift();

        try {
            const result = await operation();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.processing = false;
            this.processQueue();
        }
    }
}