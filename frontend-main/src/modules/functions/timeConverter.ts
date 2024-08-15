export function timeConverted(time, length = true) {
    if(time >= 0 && time < 60)return time + ' ' + (!length ? 'секунд' : 'сек')
    if(time >= 60 && time < 3600)return time / 60 + ' ' + (!length ? 'минут' : 'мин')
    if(time >= 3600 && time < 86400)return time / 3600 + ' ' + (!length ? 'часов' : 'час')
    if(time >= 86400 && time < 2592000)return time / 86400 + ' ' + (!length ? 'дней' : 'дней')
    if(time >= 2592000 && time < 31104000)return time / 2592000 + ' ' + (!length ? 'месяцев' : 'мес')

    return (!length ? 'больше года' : 'бол. года')
}