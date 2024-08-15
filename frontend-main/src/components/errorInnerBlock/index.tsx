import { Language } from "@modules/Language"
import { MdNearbyError } from "react-icons/md"
import { TiWarningOutline } from "react-icons/ti"

import './index.scss'

interface ErrorInnerBlockProps {
    toggle: boolean,
    text: string,

    warning?: boolean
}
export default function ErrorInnerBlock({
    toggle,
    text,

    warning
}: ErrorInnerBlockProps) {
    return (
        <div className={`errorInnerBlock ${toggle && 'show'} ${warning && 'warning'}`}>
            <div className="errorInnerBlockIcon">
                {warning ? (<TiWarningOutline />) : (<MdNearbyError />)}
            </div>
            <section className="errorInnerBlockSection">
                <h6 className="errorInnerBlockTitle">{Language(!warning ? "ERROR" : "WARNING")}</h6>
                <span className="errorInnerBlockDesc">{text}</span>
            </section>
        </div>
    )
}