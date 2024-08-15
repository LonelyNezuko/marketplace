export default function isValidEmail(email: string) {
    const re = /\S+@\S+\.\S+/
    if(!re.test(email))return false

    const m = email.substr(0, email.indexOf('@'))
    if(m.length < 4)return false

    if(/[а-яА-ЯЁё]/.test(email))return false

    return true
}