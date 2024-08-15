import { isValidEmail } from "./isValidEmail";

export function hideEmail(email: string): string {
    if(!isValidEmail(email))return email

    const atIndex = email.indexOf('@');
    if(atIndex === -1) {
        return email;
    }

    const username = email.substring(0, atIndex);
    const hiddenUsername = username.substring(0, 2) + '*'.repeat(Math.max(0, username.length - 3)) + username.slice(-1);

    const domain = email.substring(atIndex);
    const domainParts = domain.split('.');

    if(domainParts.length >= 2) {
        const firstPart = domainParts[0];
        const hiddenDomain = firstPart.substring(0, 2) + '*'.repeat(Math.max(0, firstPart.length - 3)) + firstPart.slice(-1);
        return hiddenUsername + domain.replace(firstPart, hiddenDomain);
    }
    return hiddenUsername + domain;
}