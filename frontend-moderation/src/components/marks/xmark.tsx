import { FaXmark } from "react-icons/fa6";

import './index.scss'
import MarkProps from "./props";

export default function XMark({
    size
}: MarkProps) {
    return (
        <div className={`mark xmark ${size}`}>
            <FaXmark />
        </div>
    )
}