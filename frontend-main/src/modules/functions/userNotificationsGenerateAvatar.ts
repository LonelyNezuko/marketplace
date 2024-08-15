import UserNotificationsDTO, { UserNotificationsType } from "@dto/user.notifications.dto";
import { Language } from "@modules/Language";

export function userNotificationsGenerateAvatar(notification: UserNotificationsDTO): string {
    let avatarLink: string = '/assets/notificationsAvatars/default.png'

    switch(notification.type) {
        case 'productBanned': {
            avatarLink = '/assets/notificationsAvatars/productbanned.png'
            break
        }
        case 'incomingdialogmessage': {
            avatarLink = notification.attachedUser.avatar.image
            break
        }
    }

    return avatarLink
}