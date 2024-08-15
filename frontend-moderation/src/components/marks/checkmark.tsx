import { IoIosCheckmarkCircle } from "react-icons/io";

import './index.scss'
import MarkProps from "./props";

export default function Checkmark({
    size
}: MarkProps) {
    return (
        <div className={`mark checkmark ${size}`}>
            <IoIosCheckmarkCircle />
        </div>
    )
}