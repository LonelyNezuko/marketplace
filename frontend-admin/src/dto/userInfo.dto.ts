import GeolocationDTO from "./geolocation.dto";

export default interface UserInfoDTO {
    userip?: string,
    geolocation?: GeolocationDTO,
    mapRadius?: number
}