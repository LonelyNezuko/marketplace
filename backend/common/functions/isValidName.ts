export default function isValidName([firstName, lastName]): boolean {
    if(!firstName || !lastName)return false
    if(firstName.length < 2 || lastName.length < 2
        || firstName.length > 24 || lastName.length > 24)return false
    
    return true
}