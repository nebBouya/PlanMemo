type LocalStorageConstraint = {
    constraint?: any[];
    default: any;
};

type StorageCallback<T = any> = (newValue: T, oldValue: T | null) => void;

declare class LocalStorage {
    initKey<T = any>(key: string, options: LocalStorageConstraint): void;
    read<T = any>(key: string, fallback?: T | null): T | null;
    write<T = any>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
    watch<T = any>(key: string, callback: StorageCallback<T>): void;
}

declare const instance: LocalStorage;
export default instance;
