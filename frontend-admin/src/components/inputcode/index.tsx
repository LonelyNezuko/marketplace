import React from 'react'
import $ from 'jquery'

import './index.scss'

interface InputCodeProps {
    length: number,
    disabled?: boolean,
    onSubmit?(code: string | number): void
}
export default function InputCode({
    length = 6,

    disabled,
    
    onSubmit
}: InputCodeProps) {
    const [ values, setValues ] = React.useState([])
    React.useEffect(() => {
        const tmp = []
        new Array(length).fill(0).map(item => {
            tmp.push(null)
        })

        setValues([...tmp])
    }, [length])

    const [ focusUpdate, setFocusUpdate ] = React.useState(false)
    const [ focusback, setFocusBack ] = React.useState(false)

    React.useEffect(() => {
        setFocusUpdate(false)
        setFocusBack(false)

        const index = values.findIndex(item => !item)
        if(index !== -1) {
            if(!focusback) $(`#inputcode input:nth-child(${index + 1})`).focus()
            else $(`#inputcode input:nth-child(${index})`).focus()
        }
        else $(`#inputcode input:last-child`).focus()
    }, [values, focusUpdate === true])
    React.useEffect(() => {
        const notIndex = values.findIndex(item => !item)
        if(notIndex === -1) {
            let code: string = ''
            values.map(item => {
                code += item
            })

            if(onSubmit) onSubmit(code)
        }
    }, [values])


    const [ _disabled, _setDisabled ] = React.useState(disabled)
    React.useEffect(() => {
        _setDisabled(disabled)
    }, [disabled])

    return (
        <div id="inputcode">
            {new Array(length).fill(0).map((item, i) => {
                return (<input disabled={_disabled} key={i} style={{width: `calc(100% / ${length})`}}
                    value={values[i] || ''}

                    onFocus={() => {
                        if(i > 0
                            && !values[i - 1]) setFocusUpdate(true)
                    }}
                    onKeyDown={event => {
                        if(event.key === 'Backspace') {
                            setFocusBack(true)
                            setValues(old => {
                                old[i] = null
                                return [...old]
                            })
                        }
                    }}
                    onChange={event => {
                        const value = event.target.value
                        if(values[i])return

                        if(event.target.value.length === length
                            && !i) {
                            let tmp = []
                            new Array(length).fill(0).map((item, i) => {
                                tmp.push(event.target.value[i])
                            })

                            setValues([...tmp])
                        }
                        else {
                            if(event.target.value.length > 1)return

                            setValues(old => {
                                old[i] = value
                                return [...old]
                            })
                        }
                    }}
                />)
            })}
        </div>
    )
}