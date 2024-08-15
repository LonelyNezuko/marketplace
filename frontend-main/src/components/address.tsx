import { GeolocationAddress } from "@dto/geolocation.dto"
import { Language } from "../modules/Language"

export default function Address(data: GeolocationAddress, onlycity?: boolean | number, removeCountryAndState?: boolean): string {
    if(!data)return 'Address N/A'

    let format = ''

    if(!removeCountryAndState) format += data.country || Language("UNKNOWN")
    if(data.state && !removeCountryAndState) format += ', ' + data.state
    if(data.city) {
        if(!removeCountryAndState
            && data.state) format += ', '
        format += data.city
    }
    if(data.street && !onlycity) format += ', ' + data.street
    if(data.housenumber && !onlycity) format += ', д. ' + data.housenumber

    return format
}