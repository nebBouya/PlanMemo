type StyleProps = Partial<CSSStyleDeclaration>;
type DatasetProps = Record<string, string>;

interface ExtendedEventMap extends WindowEventMap {
    "longClick": PointerEvent
}

type EventHandlerProps = {
    [K in keyof ExtendedEventMap as `on${Capitalize<string & K>}`]?: (event: ExtendedEventMap[K]) => void;
};

type CommonElementProps = {
    class?: string;
    style?: StyleProps;
    dataset?: DatasetProps;
} & {
    [key: string]: any;
};

type ElementProps = CommonElementProps & EventHandlerProps;

type Child = Node | string | number | null | undefined | Child[];

type TagName = keyof HTMLElementTagNameMap | 'fragment';

export default function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props?: ElementProps,
    ...children: Child[]
): HTMLElementTagNameMap[K];

export default function h(
    tag: 'fragment',
    props?: ElementProps,
    ...children: Child[]
): DocumentFragment;
