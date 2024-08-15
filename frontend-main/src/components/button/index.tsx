import React from "react";

import './index.scss'
import { CircleLoader } from "@components/circleLoader/circleLoader";

type ButtonSize = 'min' | 'medium' | 'normal' | 'big' | 'megabig'
type ButtonIconPosition = 'left' | 'right'
type ButtonType = 'fill' | 'border' | 'transparent' | 'hover' | 'hovertransparent'

interface ButtonProps {
    name?: React.JSX.Element | string,
    description?: string,

    id?: string,
    disabled?: boolean,

    classname?: string,
    style?: React.CSSProperties,

    icon?: React.JSX.Element,
    iconPosition?: ButtonIconPosition,
    iconOnly?: boolean,

    size?: ButtonSize,
    type?: ButtonType,

    loader?: boolean,
    selected?: boolean,

    tabIndex?: number,
    reff?: React.LegacyRef<HTMLButtonElement>,

    hoverinfo?: string,

    onClick?: () => void
}
export default function Button({
    name,
    description,

    id,
    disabled,

    classname,
    style,

    icon = null,
    iconPosition = 'left',
    iconOnly = false,

    size = 'normal',
    type = 'fill',

    loader = false,
    selected = false,

    tabIndex,
    reff,

    hoverinfo,

    onClick
}: ButtonProps) {
    return (
        <button
            id={id}
            ref={reff}

            disabled={disabled}

            className={`button ${classname} ${loader && 'button-loader'} button-size-${size} button-type-${type} button-iconposition-${iconPosition} ${iconOnly && 'button-icononly'} ${selected && 'button-selected'}`}
            style={style}
            
            tabIndex={tabIndex}

            onClick={() => {
                if(onClick) onClick()
            }}
        >
            <div className="buttonWrapper">
                {icon && <ButtonIcon icon={icon} />}
                {name && (<span className="buttonName">{name}</span>)}
            </div>
            {description && (<span className="buttonDescription">{description}</span>)}

            {hoverinfo ? (<span className="buttonHoverInfo">{hoverinfo}</span>) : ''}

            {loader && (
                <div className="buttonLoader">
                    <CircleLoader type={size === 'min' ? 'min' : null} />
                </div>
            )}
        </button>
    )
}

function ButtonIcon({ icon }) {
    return (
        <section className="buttonIcon">
            {icon}
        </section>
    )
}