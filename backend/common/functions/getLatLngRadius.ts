export default function getLatLngRadius(latlng: [ number, number ], radius: number): {
    lowLat: number,
    highLat: number,
    lowLng: number,
    highLng: number
} {
    if(!radius || !latlng || isNaN(latlng[0]) || isNaN(latlng[1]))return

    let lowLat: number
    let highLat: number
    let lowLng: number
    let highLng: number

    let lat: number
    let lng: number
    let range: number

    lat = parseInt(latlng[0] as unknown as string)
    lng = parseInt(latlng[1] as unknown as string)

    range = radius * 1000
    if(lat && lng && range
        && !isNaN(lat) && !isNaN(lng) && !isNaN(range)) {
        const latRange = range / ((6076 / 5280) * 120)
        const lngRange = (((Math.cos((lat * 3.141592653589 / 180)) * 6076.) /  5280.) * 120)

        lowLat = lat - latRange
        highLat = lat + latRange
        lowLng = lng - lngRange
        highLng = lng + lngRange
    }
    else return

    return {
        lowLat,
        highLat,
        lowLng,
        highLng
    }
}

// функция от аишки
function _getLatLngRadius(latlng: [number, number], radius: number): {
    lowLat: number,
    highLat: number,
    lowLng: number,
    highLng: number
} | undefined {
    if (!radius || !latlng || isNaN(latlng[0]) || isNaN(latlng[1])) return;

    const earthRadiusKm = 6371; // радиус Земли в километрах

    const lat = latlng[0];
    const lng = latlng[1];

    const latRadius = radius / earthRadiusKm;
    const lngRadius = radius / (earthRadiusKm * Math.cos((Math.PI * lat) / 180));

    const lowLat = lat - (latRadius * 180) / Math.PI;
    const highLat = lat + (latRadius * 180) / Math.PI;
    const lowLng = lng - (lngRadius * 180) / Math.PI;
    const highLng = lng + (lngRadius * 180) / Math.PI;

    return {
        lowLat,
        highLat,
        lowLng,
        highLng
    };
}

export function isLatLngRadius(latlngFirst: [number, number], latlngSecond: [ number, number ], radius: number): boolean {
    const result = getLatLngRadius(latlngFirst, radius)
    if(!result)return false

    if(latlngSecond[0] <= result.highLat && latlngSecond[0] >= result.lowLat
        && latlngSecond[1] >= result.lowLng && latlngSecond[1] <= result.highLng)return true
    
    return false
}