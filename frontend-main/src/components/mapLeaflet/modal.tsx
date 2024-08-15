import React from 'react'
import $ from 'jquery'

import './index'

import { Modal } from '@components/modals'
import MapLeaflet from './index'
import Input from '@components/input'
import { LatLng } from 'leaflet'

import CONFIG from '@config'
import Address from '@components/address'
import { notify } from '@modules/Notify'
import InputRange from '@components/inputrange'
import { Language } from '@modules/Language'
import GeolocationDTO, { GeolocationAddress } from '@dto/geolocation.dto'
import UserInfoDTO from '@dto/userInfo.dto'
import { isValidJSON } from '@modules/functions/isValidJSON'
import GetCityUniqueID from '@modules/GetCityUniqueID'
import GetGeolocation from '@modules/GetGeolocation'
import GetGeolocationList from '@modules/GetGeolocationList'
import Button from '@components/button'
import { CircleLoader } from '@components/circleLoader/circleLoader'

import { MdNearbyError } from "react-icons/md";
import { TiWarningOutline } from "react-icons/ti";
import CircleLoaderFullSize from '@components/circleLoader/fullsize'
import ErrorInnerBlock from '@components/errorInnerBlock'

let searchAddressTimer = null
let mapPositionTimer = null
let mapDisabledTimer = null

interface MapleafletModalProps {
    startPosition?: LatLng,
    startAddress?: string,

    _onlycity?: boolean,
    _changeonlycity?: boolean,

    onClose?(): void,
    onSubmit?(mapPosition: LatLng, addressData: GeolocationAddress, mapRadius: number): void
}
export default function MapleafletModal({
    startPosition,
    startAddress,

    _onlycity = false,
    _changeonlycity = true,

    onClose,
    onSubmit
}: MapleafletModalProps) {
    const [ address, setAddress ] = React.useState<string>(startAddress || '')
    const [ addressData, setAddressData ] = React.useState<GeolocationAddress>(null)

    const [ searchAddressList, setSearchAddressList ] = React.useState([])
    const [ searchAddressListLoader, setSearchAddressListLoader ] = React.useState(false)

    const [ mapPosition, setMapPosition ] = React.useState(startPosition || new LatLng(51.505, -0.09))

    const [ mapRadius, setMapRadius ] = React.useState(1)
    const [ mapRadiusCustom, setMapRadiusCustom ] = React.useState(false)
    const [ mapRadiusCustomShow, setMapRadiusCustomShow ] = React.useState(false)

    const [ mapDisabled, setMapDisabled ] = React.useState(false)

    const [ error, setError ] = React.useState(null)
    const [ warning, setWarning ] = React.useState(true)

    const [ onlycity, setOnlyCity ] = React.useState(_onlycity)
    const [ findMe, setFindMe ] = React.useState(false)
    const [ flyTo, setFlyTo ] = React.useState(null)

    React.useEffect(() => {
        if(!error) setWarning(false)
    }, [error])
    React.useEffect(() => {
        if(mapDisabled === true) {
            if(mapDisabledTimer) clearTimeout(mapDisabledTimer)
            mapDisabledTimer = setTimeout(() => {
                setError(Language("MAP_MODAL_WARNING_1"))
                setWarning(true)
            }, 4000)
        }
        else {
            clearTimeout(mapDisabledTimer)
            setError(null)
        }
    }, [mapDisabled])

    React.useEffect(() => {
        if(findMe === true) setFindMe(false)
    }, [findMe])
    React.useEffect(() => {
        if(flyTo) setFlyTo(null)
    }, [flyTo])
    React.useEffect(() => {
        setAddress(addressData ? Address(addressData, onlycity) : startAddress)
    }, [onlycity])

    React.useEffect(() => {
        if(addressData) {
            if(!addressData.country
                || !addressData.city
                || !addressData.cityUniqueID) setError(Language("MAP_MODAL_ERROR_1"))
        }
    }, [addressData])

    React.useEffect(() => {
        if(mapPositionTimer) clearTimeout(mapPositionTimer)
        mapPositionTimer = setTimeout(async () => {
            setMapDisabled(true)
            setError(null)

            const locationAddress: GeolocationDTO = await GetGeolocation(mapPosition)

            setAddressData(locationAddress)
            setAddress(Address(locationAddress, onlycity))

            setMapDisabled(false)
            setError(null)
        }, 300)
    }, [mapPosition])
    React.useEffect(() => {
        setSearchAddressListLoader(true)

        if(searchAddressTimer) clearTimeout(searchAddressTimer)
        searchAddressTimer = setTimeout(async () => {
            const data: Array<GeolocationDTO> = await GetGeolocationList(address)

            const tmp = []
            data.map((item: GeolocationDTO) => {
                tmp.push({ content: Address(item, onlycity), onClick: () => {
                    setAddress(Address(item, onlycity))
                    setMapPosition(new LatLng(item.lat, item.lng))

                    setFlyTo(new LatLng(item.lat, item.lng))
                } })
            })

            setSearchAddressListLoader(false)
            setSearchAddressList(tmp)
        }, 300)
    }, [address])

    React.useMemo(() => {
        setMapRadius(window.userdata.mapRadius)

        if(window.isPhone) {
            setTimeout(() => {
                $('.modal.mapleaflet .modalWrapper').css({ transform: 'none' })
            }, 50)
        }
    }, [])

    return (
        <div className="modal mapleaflet">
            <Modal
                phoneHideBtn={true}
                toggle={true} title={Language("MAP_MODAL_TITLE")} desciption={Language('MAP_MODAL_DESCRIPTION')}

                buttons={[ Language("CANCEL"), Language("SUBMIT") ]}
                buttonsBlock={mapDisabled || !!error}

                body={(
                    <div id='modalMapLeaflet'>
                        <div className="searchaddress">
                            <div className="title">
                                <h1>{Language('MAP_MODAL_ADDRESS_FORM_TITLE')}</h1>
                                {_changeonlycity ? (
                                    <section>
                                        <label htmlFor="modalMapLeafletSwitchOnlyCity">{Language('MAP_MODAL_ADDRESS_FORM_ONLY_CITY_BTN')}</label>
                                        <input disabled={mapDisabled} id='modalMapLeafletSwitchOnlyCity' type="checkbox" className="switch min" checked={onlycity} onChange={event => {
                                            setOnlyCity(event.target.checked)
                                        }} />
                                    </section>
                                ) : ''}
                            </div>
                            <section>
                                <Input disabled={mapDisabled} type='text' deleteLabel={true} id={"modalMapLeafletInput"}
                                    value={address}
                                    onInput={event => {
                                        setAddress((event.target as HTMLInputElement).value)
                                    }}

                                    autoCompleteList={searchAddressList}
                                    autoCompleteListLoader={searchAddressListLoader}
                                />

                                <Button disabled={mapDisabled} name={Language("MAP_MODAL_ADDRESS_FORM_FINDME_BTN")} size={"big"}
                                    onClick={() => setFindMe(true)}
                                />
                            </section>
                        </div>

                        <div className="searchMapBlock">
                            <MapLeaflet radius={mapRadius} position={mapPosition} disabled={mapDisabled}
                                onChange={position => {
                                    setMapPosition(position)
                                }}

                                autoGeo={findMe}
                                flyTo={flyTo}
                            />

                            {mapDisabled && (
                                <CircleLoaderFullSize />
                            )}

                            <ErrorInnerBlock toggle={!!error} warning={warning} text={error} />
                        </div>

                        <div className="searchradius">
                            <h1 className="title">{Language("MAP_MODAL_RADIUS_TITLE")}</h1>

                            {!mapRadiusCustomShow ? (
                                <div className="list">
                                    {CONFIG.mapRadiusList.map((item, i) => {
                                        return (<Button disabled={mapDisabled} name={item + ' ' + Language("KM")} type={"border"} selected={mapRadius === item && !mapRadiusCustom}
                                            onClick={() => {
                                                setMapRadius(item)
                                                setMapRadiusCustom(false)
                                            }}
                                        />)
                                    })}
                                    <Button disabled={mapDisabled} name={Language("MAP_MODAL_RADIUS_CHOICE_ANOTHER")} type={"border"} selected={mapRadiusCustom}
                                        onClick={() => setMapRadiusCustomShow(true)}
                                    />
                                </div>
                            ) : ''}

                            {mapRadiusCustomShow ? (
                                <div className="customRadius">
                                    <InputRange disabled={mapDisabled} value={mapRadius} top={true} min={1} max={200} step={1} onInput={value => {
                                        setMapRadius(value[0])
                                        setMapRadiusCustom(true)
                                    }} />
                                    <Button disabled={mapDisabled} name={Language("MAP_MODAL_RADIUS_CHOICE_ANOTHER_BACK_BTN")} type={"border"}
                                        onClick={() => setMapRadiusCustomShow(false)}
                                    />
                                </div>
                            ) : ''}
                        </div>
                    </div>
                )}

                onClick={() => {
                    if(onSubmit && !mapDisabled) onSubmit(mapPosition, addressData, mapRadius)
                }}
                onClose={() => {
                    if(onClose) {
                        if(window.isPhone) {
                            $('.modal.mapleaflet .modalWrapper').css({ transform: 'translateY(100%)' })
                            setTimeout(() => {
                                onClose()
                            }, 300)
                        }
                        else onClose()
                    }
                }}
            />
        </div>
    )
}