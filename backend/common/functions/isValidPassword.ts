export default function isValidPassword(password: string) {
    if(password.length < 6 || password.length > 45)return false

    const re = /[а-яА-ЯЁё]/
    if(re.test(password))return false

    return true
}