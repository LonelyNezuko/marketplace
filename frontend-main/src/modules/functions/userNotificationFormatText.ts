export function userNotificationFormatText(text: string) {
    if(!text || !text.length)return

    text = text.replaceAll(/(\[[\s\S]+:[\s\S]+\])/g, search => {
        const linksearch = search.match(/(https|http)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)
        if(!linksearch)return search

        const link: string = linksearch[0].slice(0, linksearch[0].length - 1)
        const name: string = search.slice(linksearch[0].length + 1, search.length - 1)

        return `<a href="${link}" target="_blank" class="link">${name}</a>`
    })

    return text
}