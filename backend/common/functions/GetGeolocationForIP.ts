import { UserGeolocation } from "src/user/user.entity";
import https from 'https'
import CONFIG_DEFAULT from "common/configs/default.config";

export async function GetGeolocationForIP(ip: string, lang?: string): Promise<UserGeolocation> {
    let responseGeolocation: UserGeolocation = {
        city: "San Antonio",
        country: "United States",
        state: "North Ih 35",
        street: null,
        housenumber: null,
        lat: 29.4963,
        lng: -98.4004,
        cityUniqueID: "51946c753925a83c4059acc5a700185b4c40f00102f9019c7bd80100000000c002079203093138323333302b7275"
    };

    function firstRequest(resolve, reject) {
        ip = ip.replace('::ffff:', '')
        if(process.env.NODE_ENV === 'development') ip = '158.246.124.136'

        https.get(`https://api.geoapify.com/v1/ipinfo?ip=${ip}&&lang=${lang || 'en'}&apiKey=${CONFIG_DEFAULT.geoApifyKeyPublic}`, response => {
            if(response.statusCode === 200) {
                const data = []

                response.on('data', chunk => {
                    data.push(chunk)
                })
                response.on('end', () => {
                    try {
                        const result = JSON.parse(Buffer.concat(data).toString())
                        const obj: UserGeolocation = {
                            city: result.city.name,
                            country: result.country.name,
                            state: result.state.name,
                            street: null,
                            housenumber: null,
                            lat: result.location.latitude,
                            lng: result.location.longitude,
                            cityUniqueID: null
                        }
                        resolve(obj)
                    }
                    catch(e) {
                        reject()
                    }
                })
            }
            else reject()
        }).on('error', reject)
    }
    function secondRequest(resolve, reject) {
        https.get(`https://api.geoapify.com/v1/geocode/reverse?lat=${responseGeolocation.lat}&lon=${responseGeolocation.lng}&apiKey=${CONFIG_DEFAULT.geoApifyKeyPublic}&lang=${lang || 'en'}&limit=1`, response => {
            if(response.statusCode === 200) {
                const data = []

                response.on('data', chunk => {
                    data.push(chunk)
                })
                response.on('end', () => {
                    try {
                        const result = JSON.parse(Buffer.concat(data).toString())
                        resolve(result.features[0].properties.place_id)
                    }
                    catch(e) {
                        reject()
                    }
                })
            }
            else reject()
        }).on('error', reject)
    }

    await new Promise(firstRequest)
        .then((res: UserGeolocation) => {
            responseGeolocation = res
        })

    if(responseGeolocation) {
        await new Promise(secondRequest)
            .then((cityUniqueID: string) => {
                responseGeolocation.cityUniqueID = cityUniqueID
            })
    }

    return responseGeolocation
}