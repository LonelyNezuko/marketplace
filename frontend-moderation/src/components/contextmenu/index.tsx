import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router-dom'

import './index.scss'
import { random } from '@modules/functions/random'

export type ContextMenuListElement = {
    content?: any,
    color?: string,
    bottom?: boolean,
    link?: string,
    target?: React.HTMLAttributeAnchorTarget,
    style?: React.CSSProperties,
    icon?: React.JSX.Element,
    disabled?: boolean
    onClick?(): void
}

interface ContextMenuProps {
    list: Array<Object>,
    onToggle?(status: boolean): void
    onElementClick?(element: ContextMenuListElement): void
}
export default function ContextMenu({
    list = [{ content: "No Actions" }],

    onToggle,
    onElementClick
}: ContextMenuProps) {
    const [ toggle, setToggle ] = React.useState(false)
    const [ position, setPosition ] = React.useState({ x: -9999, y: -9999 })

    const [ id, setID ] = React.useState(0)
    const [ eventData, setEventData ] = React.useState(null)

    const [ triggerElement, setTriggerElement ] = React.useState(null)
    const triggerElementRef = React.useRef(null)

    React.useEffect(() => {
        if(triggerElement) {
            triggerElement.on(window.isPhone ? 'click' : 'contextmenu', onContextMenu)
        }

        $(document).on('mousedown', onContextMenuClosed)
        $(document).on('touchstart', onContextMenuClosed)
        $(document).on('wheel', onContextMenuClosed)

        let id = null

        function onContextMenu(event) {
            if(!triggerElement)return
            event.preventDefault()

            id = random(1000000, 9999999)
            setID(id)

            setEventData(event)
            setToggle(true)
        }
        function onContextMenuClosed(event) {
            if(!triggerElement)return
            if($(`#contextmenu-id-${id}`).attr('data-toggle') !== 'true')return

            setTimeout(() => {
                setPosition({ x: -9999, y: -9999 })
                setToggle(false)
            }, 100)
        }

        return () => {
            if(triggerElement) {
                triggerElement.off(window.isPhone ? 'click' : 'contextmenu', onContextMenu)
            }

            $(document).off('click', onContextMenuClosed)
            $(document).off('touchstart', onContextMenuClosed)
            $(document).off('wheel', onContextMenuClosed)
        }
    })
    React.useEffect(() => {
        if(toggle) {
            const element = $('#contextmenu-id-' + id)

            let
                x = eventData.originalEvent.x,
                y = eventData.originalEvent.y

            const
                elementHeight = element[0].offsetHeight,
                elementWidth = element[0].offsetWidth,

                windowWidth = eventData.view.innerWidth,
                windowHeight = eventData.view.innerHeight
            
            if(x + elementWidth > windowWidth) x -= elementWidth
            if(y + elementHeight > windowHeight) y -= elementHeight

            setPosition({ x: x, y: y })
        }

        if(onToggle) onToggle(toggle)
    }, [toggle, id])


    React.useEffect(() => {
        setTriggerElement($(triggerElementRef.current).parent())
    }, [triggerElementRef])
    if(!toggle && !triggerElement) {
        return (<div ref={triggerElementRef} id={'contextmenu-parent-id-' + id} style={{position: 'absolute', zIndex: '-1'}}></div>)
    }

    if(!toggle)return
    return (
        <div id={'contextmenu-id-' + id} className={`contextmenu`} style={{ top: position.y + 'px', left: position.x + 'px' }} data-toggle={toggle}>
            <div className="contextmenuWrapper">
                {list.map((item: ContextMenuListElement, i) => {
                    if(!item)return
                    return (
                        <li key={i} style={{ color: item.color || '', ...item.style }}
                            className={`li ${item.bottom && 'bottom'} ${item.disabled && 'disabled'}`}
                            onClick={() => {
                                if(item.disabled)return

                                if(item.link) window.open(item.link, '_blank')
                                if(item.onClick) item.onClick()
                                if(onElementClick) onElementClick(item)
                            }}>
                            {item.content}
                        </li>
                    )
                })}
            </div>
        </div>
    )
}