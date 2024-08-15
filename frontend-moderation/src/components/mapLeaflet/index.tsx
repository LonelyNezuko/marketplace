import React from 'react'
import { Icon, LatLng, PointExpression } from 'leaflet';

import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

import './index.scss'
import FixMap from './fixmap';

const MarkerIcon = new Icon({
    iconUrl: '/assets/mapLeaflet/markericon.png',
    iconSize: [32, 32]
})

const defaultPosition = new LatLng(51.505, -0.09)
const defaultZoom = 15

interface MapLeafletProps {
    position: LatLng,
    disabled?: boolean,

    flyTo?: LatLng,
    radius?: number,

    autoGeo?: boolean,
    hideMarker?: boolean,

    onChange?(position: LatLng): void
}
export default function MapLeaflet({
    position = defaultPosition,
    disabled = false,

    flyTo,
    radius,

    autoGeo,
    hideMarker,

    onChange
}: MapLeafletProps) {
    const [ mapData, setMapData ] = React.useState<{
        position: LatLng,
        zoom: number
    }>({
        position,
        zoom: defaultZoom
    })

    const [ _disabled, _setDisabled ] = React.useState(disabled)
    React.useEffect(() => _setDisabled(disabled), [disabled])

    React.useEffect(() => {
        if(!position || !position.lat || !position.lng
            || isNaN(position.lat) || isNaN(position.lng)) position = defaultPosition
        
        setMapData({ ...mapData, position: position })
    }, [position])


    function LocationMarker() {
        const map = useMapEvents({
            drag: () => {
                if(!disabled) setMapData({ ...mapData, position: map.getCenter() })
            },
            dragend: () => {
                if(!disabled) setMapData({ ...mapData, position: map.getCenter() })
                if(onChange && !disabled) onChange(map.getCenter())
            },
            zoom: () => {
                setMapData({ ...mapData, zoom: map.getZoom() })
            },

            locationfound: event => {
                if(disabled)return
                setMapData({ ...mapData, position: event.latlng, zoom: defaultZoom })

                map.flyTo(event.latlng, defaultZoom, {
                    duration: 0.5
                })

                _setDisabled(true)
                setTimeout(() => {
                    _setDisabled(disabled)
                }, 500)

                if(onChange && !disabled) onChange(event.latlng)
            }
        })

        React.useEffect(() => {
            if(autoGeo) map.locate()
        }, [autoGeo])

        React.useEffect(() => {
            if(!flyTo)return
            if(disabled)return

            setMapData({ ...mapData, position: flyTo })
            map.flyTo(flyTo, defaultZoom, {
                duration: .5
            })

            _setDisabled(true)
            setTimeout(() => {
                _setDisabled(disabled)
            }, 500)
        }, [flyTo])
        
        // React.useEffect(() => {
        //     if(_disabled === true) {
        //         map.dragging.disable();
        //         map.keyboard.disable();
        //         if(map.tap) map.tap.disable();
        //     }
        //     else {
        //         map.dragging.enable();
        //         map.keyboard.enable();
        //         if(map.tap) map.tap.enable();
        //     }
        // }, [_disabled])

        return (
            <Marker position={mapData.position} icon={MarkerIcon}></Marker>
        )
    }

    return (
        <div className="mapLeaflet">
            <MapContainer center={mapData.position} zoom={mapData.zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <FixMap />
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                    url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />

                {!hideMarker && (<LocationMarker />)}
                {radius && (<Circle center={mapData.position} radius={radius * 1000} pathOptions={{ color: 'var(--tm-color)' }} />)}
            </MapContainer>
        </div>
    )
}