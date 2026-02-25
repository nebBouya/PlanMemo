export default function safeAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    onError?: (error: unknown) => void
): (...args: Parameters<T>) => ReturnType<T>;