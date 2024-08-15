import GeolocationDTO from "@dto/geolocation.dto";
import CONFIG from '@config'
import GetCityUniqueID from "./GetCityUniqueID";

export default async function GetGeolocationList(address: string): Promise<Array<GeolocationDTO>> {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${address}&apiKey=${CONFIG.geoApifyKey}&lang=${window.language}`)
    const data = await response.json()

    let output: Array<GeolocationDTO> = []
    if(data
        && data.features && data.features.length
        && data.features[0]) {
        Promise.all(data.features.map(async item => {
            const obj: GeolocationDTO = {
                country: item.properties.country,
                city: item.properties.city,
                state: item.properties.state,
                street: item.properties.street,
                housenumber: item.properties.housenumber,

                lat: item.properties.lat,
                lng: item.properties.lon
            }

            output.push(obj)
        }))
    }

    return output
}