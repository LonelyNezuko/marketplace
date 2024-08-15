export function subStringPoints(text, length) {
    let formatText = text.substring(0, length)
    if(text.length > length) formatText += '...'
    
    return formatText
}