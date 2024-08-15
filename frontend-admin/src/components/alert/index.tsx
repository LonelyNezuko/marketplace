import React from 'react'
import $ from 'jquery'

import { Language } from '@modules/Language'
import { random } from '@modules/functions/random'
import { CircleLoader } from '@components/circleLoader/circleLoader'

import './index.scss'

import { TiInfoLarge } from "react-icons/ti";
import { HiMiniXMark } from "react-icons/hi2";
import { IoIosWarning } from "react-icons/io";

export default function AlertIndex() {
    const [ alerts, setAlerts ] = React.useState([
        // { id: 12313, type: 'error', message: 'Вы не сохранили данные. Все данные были утеряны!', title: null },
        // { id: 1223313, type: 'success', message: 'Вы сохранили данные. Теперь они никуда не денутся!', title: null },
    ])

    React.useMemo(() => {
        $(document).on('alertEventCall', (event, message, type, title, timeout) => {
            const id = random(1000000, 9999999)
            setAlerts(old => {
                old.push({
                    id: id,
                    type,
                    message,
                    title,
                    _timeout: setTimeout(() => {
                        setAlerts(old => {
                            const index = old.findIndex(elem => elem.id === id)
                            if(index !== -1) old.splice(index, 1)

                            return [...old]
                        })
                    }, timeout || 5000)
                })
                return [...old]
            })
        })
        
        $(document).on('alertEventCall_Warning', (_, key, id, message, title, onClick, btns) => {
            setAlerts(old => {
                old.push({
                    id: id,
                    type: "warning",
                    message,
                    title,
                    onClick,
                    btns,
                    key
                })
                return [...old]
            })
        })

        $(document).on('alertEventCall_Warning_trigger', (_, id, key) => {
            set(true)
            function set(status) {
                setAlerts(old => {
                    let index = -1

                    if(id) index = old.findIndex(elem => elem.id === id)
                    else if(key) index = old.findIndex(elem => elem.key === key)

                    if(index !== -1) {
                        if(status === true
                            && !old[index].trigger) {
                            old[index].trigger = true
                            setTimeout(() => {
                                set(false)
                            }, 200)
                        }
                        else delete old[index].trigger
                    }
    
                    return [...old]
                })
            }
        })
        $(document).on('alertEventCall_Warning_remove', (_, id) => {
            setAlerts(old => {
                const index = old.findIndex(elem => elem.id === id)
                if(index !== -1) old.splice(index, 1)

                return [...old]
            })
        })
        $(document).on('alertEventCall_Warning_btnLoader', (_, id, status) => {
            setAlerts(old => {
                const index = old.findIndex(elem => elem.id === id)
                if(index !== -1) old[index].btnLoader = status

                return [...old]
            })
        })
        $(document).on('alertEventCall_Warning_btnDisable', (_, id, status) => {
            setAlerts(old => {
                const index = old.findIndex(elem => elem.id === id)
                if(index !== -1) old[index].btnDisable = status

                return [...old]
            })
        })

        $(document).on('alertEventCall_Warning_allremove', () => {
            setAlerts(old => {
                old.map((item, i) => {
                    if(item.type === 'warning') old.splice(i, 1)
                })

                return [...old]
            })
        })
    }, [])

    return (
        <div id="alerts">
            {alerts.map((item, i) => {
                return (
                    <section id={item.key} key={i} className={`alert ${item.type} ${item.trigger && 'trigger'}`} data-id={item.id}>
                        <div className="head">
                            <div className="icon">
                                {item.type === 'success' ? (<TiInfoLarge />) : item.type === 'error' ? (<HiMiniXMark />) : (<IoIosWarning />)}
                            </div>
                            <h1 className="title">{item.title || Language(item.type.toUpperCase())}</h1>
                        </div>
                        <div className="text">
                            <span>{item.message}</span>
                        </div>

                        {item.type === 'warning' ? (
                            <div className="actions">
                                <button disabled={item.btnDisable} className="btn cancel min transparent" onClick={() => {
                                    if(item.btnDisable)return
                                    item.onClick(false)
                                }}>
                                    <span>{item.btns[0]}</span>
                                </button>
                                <button disabled={item.btnDisable} className={`btn min ${item.btnLoader && 'loading'}`} onClick={() => {
                                    if(item.btnDisable)return
                                    item.onClick(true)
                                }}>
                                    <span>{item.btns[1]}</span>
                                    {item.btnLoader ? (
                                        <CircleLoader type="min" />
                                    ) : ''}
                                </button>
                            </div>
                        ) : ''}
                    </section>
                )
            })}
        </div>
    )
}

type AlertType = "error" | "success"

export function Alert(message: string, type: AlertType = "error", title?: string, timeout?: number) {
    if(!message.length)return
    if(type !== 'error' && type !== 'success')return

    $(document).trigger('alertEventCall', [ message, type, title, timeout ])
}
export function AlertWarning(key: string | number, message: string, onClick: Function, title: string, btns: [string, string] = [ Language("CANCEL"), Language("REFRESH") ]) {
    if(!message.length)return

    const id = random(1000000, 9999999)
    $(document).trigger('alertEventCall_Warning', [ key, id, message, title, onClick, btns ])

    function trigger() {
        $(document).trigger('alertEventCall_Warning_trigger', [ id ])
    }
    function remove() {
        $(document).trigger('alertEventCall_Warning_remove', [ id ])
    }
    function btnLoader(status) {
        $(document).trigger('alertEventCall_Warning_btnLoader', [ id, status ])
    }
    function btnDisable(status) {
        $(document).trigger('alertEventCall_Warning_btnDisable', [ id, status ])
    }

    return [ trigger, remove, btnLoader, btnDisable ]
}
export function AlertWarningAllRemove() {
    $(document).trigger('alertEventCall_Warning_allremove')
}
export function AlertWarningTriiggerForKey(key: string | number) {
    $(document).trigger('alertEventCall_Warning_trigger', [ null, key ])
}