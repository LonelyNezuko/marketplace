import React from 'react'
import $ from 'jquery'

import './index.scss'

interface InputRangeProps {
    multi?: boolean,
    disabled?: boolean,

    min: number,
    max: number,
    step?: number,

    value?: number,
    value2?: number,

    top?: boolean,
    hidePhoneCounter?: boolean,

    onInput?(value: [number, number]): void
}
export default function InputRange({
    multi = false,
    disabled,

    min,
    max,
    step = 1,

    value = 0,
    value2 = 0,

    top = false,
    hidePhoneCounter,
    
    onInput
}: InputRangeProps) {
    const refInput = React.useRef()
    const refInput2 = React.useRef()

    const [ proxCss, setProxCss ] = React.useState('0px')
    const [ proxCssTwo, setProxCssTwo ] = React.useState('0px')

    const [ widthSlider, setWidthSlider ] = React.useState(0)

    React.useEffect(() => {
        const percent = (value - min) / (max - min)
        const percentTwo = (value2 - min) / (max - min)

        setProxCss(widthSlider * percent + 'px')
        setProxCssTwo(widthSlider * percentTwo + 'px')
    }, [value, value2, widthSlider])

    React.useEffect(() => {
        if(refInput) setWidthSlider($(refInput.current).width())
        else if(refInput2) setWidthSlider($(refInput2.current).width())
    })

    function onChange(event, id) {
        const val = parseInt(event.target.value)
        let output: [number, number] = [0,0]
        
        if(id === 2) {
            if(val <= (value + 3))return event.preventDefault()
            output = [value, val]
        }
        else {
            if(multi && val >= (value2 + 3))return event.preventDefault()
            output = [val, value2]
        }

        if(onInput) {
            setTimeout(() => {
                onInput(output)
            }, 10)
        }
    }

    return (
        <div className="inputrange">
            {(window.isPhone && !hidePhoneCounter) ? (
                <div className="inputrange-phonecounter">
                    <span>{max}</span>
                    <span>{value}</span>
                </div>
            ) : ''}

            <div className="inputrange-wrapper">
                <div className="inputrange-bg">
                    {!multi ? (
                        <div className="inputrange-fill" style={{width: parseInt(proxCss.replace('px', '')) - parseInt(proxCssTwo.replace('px', '')) + 'px', left: proxCssTwo}}></div>
                    ) : (
                        <div className="inputrange-fill" style={{width: parseInt(proxCssTwo.replace('px', '')) - parseInt(proxCss.replace('px', '')) + 'px', left: proxCss}}></div>
                    )}
                </div>

                {multi ? (
                    <div className="inputrange-slider inputrange-slider-multi">
                        <input disabled={disabled} type="range" min={min} max={max} step={step} value={value2} onChange={event => onChange(event, 2)} ref={refInput2} />

                        <div className="inputrange-slider-count-wrap">
                            <div className={`inputrange-slider-count ${top && 'inputrange-top'}`} style={{left: proxCssTwo, transform: `translateX(-${parseInt(proxCssTwo.replace('px', '')) * (widthSlider / 30) / 150}%)`}}>
                                <span>{value2}</span>
                            </div>
                        </div>
                    </div>
                ) : ''}

                <div className="inputrange-slider">
                    <input disabled={disabled} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(event, 1)} ref={refInput} />

                    <div className="inputrange-slider-count-wrap">
                        <div className={`inputrange-slider-count ${top && 'inputrange-top'}`} style={{left: proxCss, transform: `translateX(-${parseInt(proxCss.replace('px', '')) * (widthSlider / 20) / (widthSlider / 2.5)}%)`}}>
                            <span>{value}</span>
                        </div>
                    </div>
                </div>
            </div>

            {(window.isPhone && multi && !hidePhoneCounter) ? (
                <div className="inputrange-phonecounter multi">
                    <span>{max}</span>
                    <span>{value2}</span>
                </div>
            ) : ''}
        </div>
    )
}