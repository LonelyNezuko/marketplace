export interface GeolocationAddress {
    city?: string
    country?: string
    state?: string
    street?: string
    housenumber?: string | number,
    cityUniqueID?: string
}

export default interface GeolocationDTO extends GeolocationAddress {
    lat: number
    lng: number
}