import GeolocationDTO from "@dto/geolocation.dto";
import { LatLng } from "leaflet";
import CONFIG from '@config'
import GetCityUniqueID from "./GetCityUniqueID";

export default async function GetGeolocation(latlng: LatLng): Promise<GeolocationDTO> {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latlng.lat}&lon=${latlng.lng}&apiKey=${CONFIG.geoApifyKey}&lang=${window.language}&limit=1`)
    const data = await response.json()

    let output: GeolocationDTO = null
    if(data
        && data.features && data.features.length
        && data.features[0]) {
        output = {
            country: data.features[0].properties.country,
            city: data.features[0].properties.city,
            state: data.features[0].properties.state,
            street: data.features[0].properties.street,
            housenumber: data.features[0].properties.housenumber,

            lat: latlng.lat,
            lng: latlng.lng
        }
        output.cityUniqueID = await GetCityUniqueID(output.city) || null
    }
    
    return output
}