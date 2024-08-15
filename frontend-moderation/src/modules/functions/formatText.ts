export function formatText(text, maxlength) {
    if(!text)return ''

    // text = text.replaceAll('\n', '<br />')
    if(maxlength && text.length > maxlength) {
        text = text.slice(0, maxlength)
        text += '...'
    }

    return text
}