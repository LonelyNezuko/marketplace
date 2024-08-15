import React from 'react'

import './index.scss'

import { FaArrowDown, FaArrowUp } from "react-icons/fa6";

export default function InputUpDown({
    min,
    max,

    value = 0,
    onChange
}) {
    const [ _value, _setValue ] = React.useState(null)
    React.useEffect(() => {
        if(value < min) _setValue(min)
        else if(value > max) _setValue(max)
        else _setValue(value)
    }, [value])

    React.useEffect(() => {
        if(_value === null)return
        let value

        if((_value[0] === '0' || _value[0] === 0) && _value.length > 1) {
            value = _value.replace(/^0+/, '')
            _setValue(value)
        }

        if(onChange) onChange(parseInt(_value))
    }, [_value])

    return (
        <div className="inputupdown">
            <input type="number" value={_value} disabled={true} />
            <div className="arrows">
                <button className="down" onClick={() => {
                    _setValue(old => {
                        if(parseInt(old) >= max)return parseInt(old)
                        return parseInt(old) + 1
                    })
                }}>
                    <FaArrowDown />
                </button>
                <button className="up" onClick={() => {
                    _setValue(old => {
                        if(parseInt(old) <= min)return parseInt(old)
                        return parseInt(old) - 1
                    })
                }}>
                    <FaArrowUp />
                </button>
            </div>
        </div>
    )
}