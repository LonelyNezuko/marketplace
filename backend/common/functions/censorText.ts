export function censorText(text: string) {
    return text[0] + "*".repeat(text.length - 2) + text.slice(-1);
}