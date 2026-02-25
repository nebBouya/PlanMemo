interface ReactiveNode {
    deps?: Link;
    depsTail?: Link;
    subs?: Link;
    subsTail?: Link;
    flags: ReactiveFlags;
}
interface Link {
    dep: ReactiveNode;
    sub: ReactiveNode;
    prevSub: Link | undefined;
    nextSub: Link | undefined;
    prevDep: Link | undefined;
    nextDep: Link | undefined;
}
declare const enum ReactiveFlags {
    None = 0,
    Mutable = 1,
    Watching = 2,
    RecursedCheck = 4,
    Recursed = 8,
    Dirty = 16,
    Pending = 32
}
interface EffectScope extends ReactiveNode {
}
export interface Signal<T> {
    (): T | undefined;
    (value: T | undefined): void;
}
export declare function createReactiveSystem({ update, notify, unwatched, }: {
    update(sub: ReactiveNode): boolean;
    notify(sub: ReactiveNode): void;
    unwatched(sub: ReactiveNode): void;
}): {
    link: (dep: ReactiveNode, sub: ReactiveNode) => void;
    unlink: (link: Link, sub?: ReactiveNode) => Link | undefined;
    propagate: (link: Link) => void;
    checkDirty: (link: Link, sub: ReactiveNode) => boolean;
    endTracking: (sub: ReactiveNode) => void;
    startTracking: (sub: ReactiveNode) => void;
    shallowPropagate: (link: Link) => void;
};
export declare let batchDepth: number;
export declare function getCurrentSub(): ReactiveNode | undefined;
export declare function setCurrentSub(sub: ReactiveNode | undefined): ReactiveNode | undefined;
export declare function getCurrentScope(): EffectScope | undefined;
export declare function setCurrentScope(scope: EffectScope | undefined): EffectScope | undefined;
export declare function startBatch(): void;
export declare function endBatch(): void;
export declare function pauseTracking(): void;
export declare function resumeTracking(): void;
export declare function signal<T>(): Signal<T>;
export declare function signal<T>(initialValue: T): Signal<T>;
export declare function computed<T>(getter: (previousValue?: T) => T): () => T;
export declare function effect<T>(fn: () => T): () => void;
export declare function effectScope<T>(fn: () => T): () => void;