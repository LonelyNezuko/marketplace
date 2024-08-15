import React from 'react'
import $ from 'jquery'

import './index.scss'
import { random } from '@modules/functions/random'
import { Link } from 'react-router-dom'
import { ContextMenuListElement } from '@components/contextmenu'

export interface DropdownMenuListElement extends ContextMenuListElement {

}
interface DropdownMenuProps {
    list: Array<DropdownMenuListElement>,

    style?: React.CSSProperties,
    onToggleChange?(toggle: boolean): void
}
export default function DropdownMenu({
    list = [{ content: "No Actions" }],

    style,
    onToggleChange
}: DropdownMenuProps) {
    const [ toggle, setToggle ] = React.useState(false)
    const [ id, setID ] = React.useState(0)

    const [ triggerElement, setTriggerElement ] = React.useState(null)
    const triggerElementRef = React.useRef(null)

    React.useEffect(() => {
        if(triggerElement) {
            triggerElement.on('mousedown', onDropdownMenu)

            $(document).on('click', onDropdownMenuClosed)
            $(document).on('touchstart', onDropdownMenuClosed)
            $(document).on('wheel', onDropdownMenuClosed)
        }

        function onDropdownMenu(event) {
            if(event.button)return
            if($('#dropdownmenu-id-' + id).is(event.target) || $('#dropdownmenu-id-' + id).has(event.target).length)return

            event.preventDefault()
            
            setToggle(old => !old)
            setID(random(100000, 999999))
        }
        function onDropdownMenuClosed(event) {
            if(!toggle)return
            if(triggerElement.is(event.target) || triggerElement.has(event.target).length)return

            setToggle(false)
        }

        return () => {
            if(triggerElement) {
                triggerElement.off('mousedown', onDropdownMenu)
                
                $(document).off('click', onDropdownMenuClosed)
                $(document).off('touchstart', onDropdownMenuClosed)
                $(document).off('wheel', onDropdownMenuClosed)
            }
        }
    })


    React.useEffect(() => {
        if(onToggleChange) onToggleChange(toggle)
    }, [toggle])
    
    React.useEffect(() => {
        setTriggerElement($(triggerElementRef.current).parent())
    }, [triggerElementRef])
    if(!toggle && !triggerElement)return (<div ref={triggerElementRef} id={'dropdownmenu-parent-id-' + id} style={{position: 'absolute', zIndex: '-1'}}></div>)


    if(!toggle)return
    return (
        <div id={'dropdownmenu-id-' + id} className="dropdownmenu" style={style} onClick={() => {
            if(window.isPhone) setToggle(false)
        }}>
            <div className="dropdownmenuwrapper">
                {list.map((item: DropdownMenuListElement, i) => {
                    if(!item)return

                    if(item.link)return (
                        <Link key={i} style={{ color: item.color || '', ...item.style }} target={item.target || null} to={item.link}
                            className={`li ${item.bottom && 'bottom'}`}
                            onClick={() => {
                                if(item.onClick) item.onClick()
                                setToggle(false)
                            }}>

                            {item.icon && item.icon}
                            {item.content}
                        </Link>)
                    return (
                        <li key={i} style={{ color: item.color || '', ...item.style }}
                            className={`li ${item.bottom && 'bottom'} ${item.disabled && 'disabled'}`}
                            onClick={() => {
                                if(item.onClick) item.onClick()
                                setToggle(false)
                            }}>

                            {item.icon && item.icon}
                            {item.content}
                        </li>)
                })}
            </div>
        </div>
    )
}