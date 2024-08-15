import CONFIG from '@config'

export default async function GetCityUniqueID(cityname: string): Promise<string> {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${cityname}&lang=en&limit=1&type=city&format=json&apiKey=${CONFIG.geoApifyKey}`)
    const data = await response.json()

    let id = ''
    if(data && data.results && data.results.length
        && data.results[0] && data.results[0].place_id) id = data.results[0].place_id
    
    return id
}