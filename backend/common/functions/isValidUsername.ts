export default function isValidUsername(username: string) {
    if(username.length < 3 || username.length > 45)return false

    const re = /[а-яА-ЯЁё]/
    if(re.test(username))return false

    return true
}