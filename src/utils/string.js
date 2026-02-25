function isEmpty(
    str,
    config = {},
) {
    const { ignoreWhitespace = true } = config;
    str = ignoreWhitespace ? str.trim() : str;
    return str.length === 0;
}

const UNESCAPED_SEPARATORS = [
    '[',
    ']',
    '{',
    '}',
    '(',
    ')',
    '|',
    '/',
    '-',
    '\\',
];
const SEPARATORS = [...UNESCAPED_SEPARATORS, ' ', '_', '.'];

function escapeChar(char) {
    return UNESCAPED_SEPARATORS.includes(char) ? `\\${char}` : char;
}

const SEPARATOR_REGEX = new RegExp(
    `[${SEPARATORS.map(escapeChar).join('')}]`,
    'g',
);

function tokenize(sentence, onlyLetterNumber = false) {
    const normalizeString = sentence
        .replace(SEPARATOR_REGEX, ' ')
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .trim();
    let words = normalizeString.match(/\b[a-zA-Z0-9_\-./]+\b/g) || [];
    if (onlyLetterNumber) {
        words = words.filter(word => /^[a-zA-Z0-9]+$/.test(word));
    }
    return words;
}

function applyTransformation(
    words,
    transformFunc,
    delimiter = ' ',
) {
    return words.map(transformFunc).join(delimiter);
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function uncapitalize(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

export function titleCase(str) {
    return applyTransformation(tokenize(str, true), capitalize);
}

export function camelCase(str) {
    return applyTransformation(
        tokenize(str, true),
        (word, index) => {
            if (index === 0) return word.toLowerCase();
            return capitalize(word);
        },
        '',
    );
}

export function constantCase(str) {
    return applyTransformation(
        tokenize(str, true),
        (word) => word.toUpperCase(),
        '_',
    );
}

export function snakeCase(str) {
    return applyTransformation(
        tokenize(str, true),
        (word) => word.toLowerCase(),
        '_',
    );
}

export function kebabCase(str) {
    return applyTransformation(
        tokenize(str, true),
        (word) => word.toLowerCase(),
        '-',
    );
}

export function pascalCase(str) {
    return applyTransformation(
        tokenize(str, true),
        (word) => capitalize(word),
        '',
    );
}

export default {
    isEmpty,
    case: {
        capitalize,
        uncapitalize,
        title: titleCase,
        camel: camelCase,
        constant: constantCase,
        snake: snakeCase,
        kebab: kebabCase,
        pascal: pascalCase
    }
}
