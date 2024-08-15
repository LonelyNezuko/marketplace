import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'
import Cookies from 'universal-cookie'

import './index.scss'

import { Select, SelectListObject } from '@components/select/select'
import { Modal } from '..'

import CONFIG from '@config'
import { renderCurrencyIcon } from '@modules/functions/renderCurrencyIcon'
import { Alert } from '@components/alert'
import { Language } from '@modules/Language'
import GeolocationDTO from '@dto/geolocation.dto'
import Address from '@components/address'

interface ModalFirstSettingsProps {
    defaultLang?: string,
    defaultCurrency?: string,

    isMenu?: boolean,

    onChange?(language?: any, currency?: string, changeGeolocation?: boolean): void
}
export function ModalFirstSettings({
    defaultLang,
    defaultCurrency,

    isMenu,
    
    onChange
}: ModalFirstSettingsProps) {
    const [ language, setLanguage ] = React.useState(defaultLang)
    const [ list, setList ] = React.useState([])

    const [ currency, setCurrency ] = React.useState(defaultCurrency)

    const [ geolocation, setGeolocation ] = React.useState<GeolocationDTO>(null)
    const [ changeGeolocation, setChangeGeolocation ] = React.useState(false)
    
    React.useEffect(() => {
        setGeolocation(window.userdata.geolocation)
        console.log(window.userdata.geolocation)
    }, [window.userdata.geolocation])

    React.useEffect(() => {
        setLanguage(defaultLang)
    }, [defaultLang])
    React.useEffect(() => {
        setCurrency(defaultCurrency)
    }, [defaultCurrency])

    React.useMemo(() => {
        if(window.languageList && window.languageList.length) {
            let tmp = []

            window.languageList.map(item => {
                tmp.push([ item.code, item.name ])
            })
            setList(tmp)
        }

        if(window.isPhone) {
            setTimeout(() => {
                $('#modalFirstStart .modalWrapper').css({ transform: 'none' })
            }, 50)
        }
    }, [])

    function _onChange(language?: any, currency?: string, changeGeolocation?: boolean) {
        if(!window.isPhone) onChange(language, currency, changeGeolocation)
        else {
            $('#modalFirstStart .modalWrapper').css({ transform: 'translateY(100%)' })
            setTimeout(() => {
                onChange(language, currency, changeGeolocation)
            }, 300)
        }
    }

    return (
        <div id="modalFirstStart">
            <Modal toggle={true}
                phoneHideBtn={isMenu}

                title={"Customize everything for yourself"}
                desciption={!isMenu && (<>In the future, you <Link className="link" target="_blank" to="/account/settings">can change the settings</Link></>)}
                
                body={(
                    <div className="modalSetLanguage-body">
                        <div className="modalSetLanguage-body-title">Your language</div>
                        <Select _type={language} _list={window.languageList.map((item): SelectListObject => {
                            return { key: item.code, content: item.name, icon: item.code.toUpperCase() }
                        })} onChange={(elem: SelectListObject<string>) => {
                            setLanguage(elem.key)
                        }} version={2} />

                        <div className="modalSetLanguage-body-title" style={{ marginTop: "16px" }}>Your currency</div>
                        <Select _type={currency} _list={CONFIG.currencyList.map((item): SelectListObject => {
                            return { key: item.code, content: item.name, icon: renderCurrencyIcon(item.code) }
                        })} onChange={(elem: SelectListObject<string>) => {
                            setCurrency(elem.key)
                        }} version={2} search={true} />

                        {(geolocation && !isMenu) ? (
                            <div className="modalSetLanguage-body-title" style={{ marginTop: "16px" }}>
                                Also make sure that we have correctly identified your location:
                                <span style={{ color: 'var(--tm-color)', display: 'block', marginTop: '8px', fontWeight: '600', fontSize: '16px' }}>{Address(geolocation, true)}</span>
                                
                                <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
                                    <span>If not, then switch the toggle switch</span>
                                    <input checked={changeGeolocation} type="checkbox" className="switch" onChange={event => {
                                        setChangeGeolocation(event.target.checked)
                                    }} />
                                </section>
                            </div>
                        ) : ''}
                    </div>
                )}
                buttons={[ "Cancel", "Apply" ]}

                modalBodyOverflow={"visible"}

                onClose={() => _onChange()}
                onClick={() => {
                    if(!currency || !currency.length)return Alert("Select a currency")
                    _onChange(language, currency, changeGeolocation)
                }}
            />
        </div>
    )
}