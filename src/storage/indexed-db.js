import { updateObj } from "../utils/object.js";
import TransactionQueue from "../api/transaction-queue.js";
import logger from "../utils/logger.js"

export default class IndexedDBClient {
    #dbName;
    #version;
    #db;
    #schema;
    #transactionQueue;

    constructor(dbName, version = 1) {
        this.#dbName = dbName;
        this.#version = version;
        this.#db = null;
        this.#schema = {};
        this.#transactionQueue = new TransactionQueue();
    }

    async connect(schemaDefinition) {
        this.#schema = schemaDefinition;

        return new Promise((resolve, reject) => {
            const checkReq = indexedDB.open(this.#dbName);
            checkReq.onerror = () => {
                reject(`Failed to check database version: ${checkReq.error}`);
            };

            checkReq.onsuccess = (event) => {
                const db = event.target.result;
                const existingVersion = db.version;
                db.close();
                const versionToUse = Math.max(this.#version, existingVersion);
                this.#version = versionToUse;
                const upgradeReq = indexedDB.open(this.#dbName, versionToUse);

                upgradeReq.onupgradeneeded = (event) => {
                    const upgradeDb = event.target.result;
                    for (const [storeName, options] of Object.entries(this.#schema)) {
                        if (!upgradeDb.objectStoreNames.contains(storeName)) {
                            const store = upgradeDb.createObjectStore(storeName, {
                                keyPath: options.keyPath,
                                autoIncrement: options.autoIncrement
                            });

                            if (options.indexes) {
                                for (const idx of options.indexes) {
                                    store.createIndex(idx.name, idx.keyPath, idx.options || {});
                                }
                            }
                        }
                    }
                };

                upgradeReq.onsuccess = (event) => {
                    this.#db = event.target.result;
                    resolve(this);
                };

                upgradeReq.onerror = (event) => {
                    reject(`Database connection failed: ${event.target.error}`);
                };

                upgradeReq.onblocked = () => {
                    reject("Database upgrade blocked. Please close other tabs or reload.");
                };
            };
        });
    }



    async transaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            if (!this.#db) return reject("Database not initialized.");
            if (!this.#db.objectStoreNames.contains(storeName)) {
                return reject(`Table '${storeName}' does not exist.`);
            }
            const transaction = this.#db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            transaction.onerror = (event) => reject(`Transaction failed: ${event.target.error}`);
            transaction.oncomplete = () => resolve();
            callback(store);
        });
    }

    async createTable(storeName, options = { keyPath: "id", autoIncrement: true }) {
        return new Promise((resolve, reject) => {
            const checkReq = indexedDB.open(this.#dbName);
            checkReq.onerror = () => reject(checkReq.error);
            checkReq.onsuccess = (event) => {
                const db = event.target.result;
                if (db.objectStoreNames.contains(storeName)) {
                    db.close();
                    resolve(`Table '${storeName}' already exists.`);
                    return;
                }
                const newVersion = db.version + 1;
                db.close();
                if (this.#db) {
                    this.#db.close();
                    this.#db = null;
                }
                const upgradeReq = indexedDB.open(this.#dbName, newVersion);
                upgradeReq.onupgradeneeded = (event) => {
                    const upgradeDb = event.target.result;
                    const store = upgradeDb.createObjectStore(storeName, {
                        keyPath: options.keyPath,
                        autoIncrement: options.autoIncrement
                    });

                    if (options.indexes) {
                        for (const idx of options.indexes) {
                            store.createIndex(idx.name, idx.keyPath, idx.options || {});
                        }
                    }
                };
                upgradeReq.onsuccess = (event) => {
                    this.#db = event.target.result;
                    this.#version = newVersion;
                    resolve(`Table '${storeName}' created successfully.`);
                };
                upgradeReq.onerror = (event) => {
                    reject(`Failed to create table '${storeName}': ${event.target.error}`);
                };
                upgradeReq.onblocked = () => {
                    logger.error(`Database upgrade blocked for '${storeName}'. Close other tabs or reload.`);
                    reject(`Upgrade blocked while creating table '${storeName}'.`);
                };
            };
        });
    }



    async get(storeName, key) {
        if (key === undefined || key === null) {
            return Promise.reject(`Invalid key passed to get(): ${key}`);
        }
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) =>
                    reject(`Error fetching key ${key}: ${event.target.error}`);
            });
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) => reject(`Error fetching records: ${event.target.error}`);
            });
        });
    }

    async batchGet(storeName, keys) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                const results = [];
                let pending = keys.length;

                keys.forEach((key) => {
                    const request = store.get(key);
                    request.onsuccess = () => {
                        results.push(request.result);
                        if (--pending === 0) resolve(results);
                    };
                    request.onerror = (event) => reject(`Error fetching batch: ${event.target.error}`);
                });
            });
        });
    }

    async rangeQuery(storeName, indexName, lowerBound, upperBound) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                if (!store.indexNames.contains(indexName)) {
                    return reject(`Index '${indexName}' does not exist on store '${storeName}'`);
                }
                const index = store.index(indexName);
                const range = IDBKeyRange.bound(lowerBound, upperBound);
                const request = index.openCursor(range);
                const results = [];
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        results.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(results);
                    }
                };
                request.onerror = (event) => reject(`Range query failed: ${event.target.error}`);
            });
        });
    }

    async getRelatedRecords(storeName, relatedIds) {
        return await this.batchGet(storeName, relatedIds);
    }

    async where(storeName, filterCallback) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result.filter(filterCallback));
                request.onerror = (event) => reject(`Search failed: ${event.target.error}`);
            });
        });
    }

    async paginate(storeName, limit, offset = 0) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result.slice(offset, offset + limit));
                request.onerror = (event) => reject(`Pagination failed: ${event.target.error}`);
            });
        });
    }

    async set(storeName, key, value) {
        return this.#transactionQueue.addOperation(() => this.#internalSet(storeName, key, value));
    }

    async #internalSet(storeName, key, value) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readwrite", (store) => {
                const usesInlineKey = store.keyPath !== null;
                const request = usesInlineKey ? store.put(value) : store.put(value, key);
                request.onsuccess = () => {
                    const keyPathName = store.keyPath ?? 'key';
                    const generatedKey = request.result;
                    const resultValue = {
                        ...value,
                        [keyPathName]: usesInlineKey ? (value[keyPathName] ?? generatedKey) : generatedKey
                    };
                    resolve(resultValue);
                };
                request.onerror = (event) => reject(`Error saving record: ${event.target.error}`);
            });
        });
    }

    async update(storeName, key, newData) {
        return this.#transactionQueue.addOperation(() => this.#internalUpdate(storeName, key, newData))
    }

    async #internalUpdate(storeName, key, newData) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readwrite", (store) => {
                const request = store.get(key);
                request.onsuccess = async () => {
                    const existingData = request.result;
                    if (!existingData) return reject(`No record found for key ${key}`);
                    const updatedData = updateObj(existingData, newData);
                    const usesInlineKey = store.keyPath !== null;
                    const putRequest = usesInlineKey ? store.put(updatedData) : store.put(updatedData, key);
                    putRequest.onsuccess = async () => resolve(updatedData);
                    putRequest.onerror = (event) => reject(`Error saving updated record: ${event.target.error}`);
                };
                request.onerror = (event) => reject(`Error fetching record: ${event.target.error}`);
            });
        });
    }

    async delete(storeName, key) {
        return this.#transactionQueue.addOperation(() => this.#internalDelete(storeName, key))
    }

    async #internalDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            const record = this.get(storeName, key);
            if (!record) return reject(`No record found for key ${key}`);
            this.transaction(storeName, "readwrite", (store) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve(`Deleted ${storeName} record ${key}`);
                request.onerror = (event) => reject(`Error deleting record: ${event.target.error}`);
            });
        });
    }

    async addIndexes(storeName, newIndexes = [], storeOptions = { keyPath: "id", autoIncrement: true }) {
        return new Promise((resolve, reject) => {
            const checkReq = indexedDB.open(this.#dbName);
            checkReq.onerror = () => reject(`Failed to check current version: ${checkReq.error}`);
            checkReq.onsuccess = (event) => {
                const db = event.target.result;
                const newVersion = db.version + 1;
                const storeExists = db.objectStoreNames.contains(storeName);
                db.close();

                if (this.#db) {
                    this.#db.close();
                    this.#db = null;
                }

                const upgradeReq = indexedDB.open(this.#dbName, newVersion);

                upgradeReq.onupgradeneeded = (event) => {
                    const upgradeDb = event.target.result;
                    let store;

                    if (!storeExists) {
                        store = upgradeDb.createObjectStore(storeName, storeOptions);
                    } else {
                        store = event.target.transaction.objectStore(storeName);
                    }

                    for (const idx of newIndexes) {
                        if (!store.indexNames.contains(idx.name)) {
                            store.createIndex(idx.name, idx.keyPath, idx.options || {});
                        }
                    }
                };

                upgradeReq.onsuccess = (event) => {
                    this.#db = event.target.result;
                    this.#version = newVersion;
                    resolve(`Indexes added to '${storeName}' successfully.`);
                };

                upgradeReq.onerror = (event) => {
                    reject(`Failed to add indexes: ${event.target.error}`);
                };

                upgradeReq.onblocked = () => {
                    reject("Database upgrade blocked. Please close other tabs or reload.");
                };
            };
        });
    }

    async clear(storeName) {
        return this.transaction(storeName, "readwrite", (store) => store.clear());
    }

    async count(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            this.transaction(storeName, "readonly", (store) => {
                let request;

                if (indexName) {
                    if (!store.indexNames.contains(indexName)) {
                        return reject(`Index '${indexName}' does not exist on store '${storeName}'`);
                    }
                    const index = store.index(indexName);
                    request = query !== null ? index.count(query) : index.count();
                } else {
                    request = query !== null ? store.count(query) : store.count();
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = (event) =>
                    reject(`Failed to count records in '${storeName}': ${event.target.error}`);
            });
        });
    }
}