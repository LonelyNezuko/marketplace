// import { API } from "./API"
// import $ from 'jquery'

// import CONFIG from '@config'
// import { notify } from "@modules/Notify";
// import { isValidJSON } from "@functions/isValidJSON";
// import GeolocationDTO from "@dto/geolocation.dto";
// import UserInfoDTO from "@dto/userInfo.dto";
// import GetCityUniqueID from "./GetCityUniqueID";

// let loading = false

// export function GeoInit(callback?: (geolocation?: UserInfoDTO) => void) {
//     if(loading)return
    
//     let tmpUserInfo: any = window.localStorage.getItem('userInfo') || {}
//     let tmpCurrency: any = window.localStorage.getItem('currency') || CONFIG.defaultCurrency

//     if(isValidJSON(tmpUserInfo)) tmpUserInfo = JSON.parse(tmpUserInfo)

//     if(tmpCurrency) {
//         const find = CONFIG.currencyList.find(item => item.code === tmpCurrency)
//         window.userdata.currency = find ? tmpCurrency : CONFIG.defaultCurrency
//     }
//     if(tmpUserInfo && tmpUserInfo.geolocation) {
//         if(tmpUserInfo.geolocation.city
//             && tmpUserInfo.geolocation.country
//             && tmpUserInfo.geolocation.state) {
//             callback(tmpUserInfo)
//             loading = true

//             return window.localStorage.setItem('userInfo', JSON.stringify(tmpUserInfo))
//         }
//     }

//     loading = true
//     fetch(`https://api.geoapify.com/v1/ipinfo?lang=${window.language || 'en'}&apiKey=${CONFIG.geoApifyKey}`, { method: 'get' })
//         .then(response => response.json())
//         .then(result => {
//             const userInfo: UserInfoDTO = {
//                 userip: "",
//                 geolocation: {
//                     city: "",
//                     country: "",
//                     state: "",
//                     street: "",
//                     housenumber: "",
//                     cityUniqueID: '-1',
//                     lat: 0,
//                     lng: 0
//                 },
//                 mapRadius: 0
//             }

//             userInfo.userip = result.ip
//             userInfo.geolocation.lat = result.location.latitude
//             userInfo.geolocation.lng = result.location.longitude

//             userInfo.mapRadius = 50

//             window.userdata.currency = result.country.currency || CONFIG.defaultCurrency
//             window.currencyChoiceModal = true

//             fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${result.location.latitude}&lon=${result.location.longitude}&apiKey=${CONFIG.geoApifyKey}&lang=${window.language}&limit=1`)
//                 .then(response => response.json())
//                 .then(async response => {
//                     const data = {
//                         city: response.features[0].properties.city,
//                         country: response.features[0].properties.country,
//                         state: response.features[0].properties.state,
//                         street: response.features[0].properties.street,
//                         housenumber: response.features[0].properties.housenumber,
//                         cityUniqueID: '-1'
//                     }

//                     if(!data.city) data.city = 'London'
//                     if(!data.country) data.country = 'United Kingdom'

//                     data.cityUniqueID = await GetCityUniqueID(data.city)
//                     userInfo.geolocation = {...userInfo.geolocation, ...data}

//                     window.localStorage.setItem('userInfo', JSON.stringify(userInfo))
//                     window.geolocationChoiceModal = true

//                     if(callback) callback(userInfo)
//                 })
//                 .catch(async error => {
//                     userInfo.geolocation.city = 'London'
//                     userInfo.geolocation.country = 'United Kingdom'
//                     userInfo.geolocation.state = null
//                     userInfo.geolocation.street = null
//                     userInfo.geolocation.housenumber = null
//                     userInfo.geolocation.cityUniqueID = await GetCityUniqueID('London')

//                     window.localStorage.setItem('userInfo', JSON.stringify(userInfo))
//                     window.geolocationChoiceModal = true

//                     if(callback) callback(userInfo)
                    
//                     console.log("(GeoInit) api.geoapify.com/v1/geocode/reverse: " + error)
//                 })
//         })
//         .catch(error => {
//             if(callback) callback()
//             console.log("(GeoInit) api.geoapify.com/v1/ipinfo: " + error)
//         });
// }