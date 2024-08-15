import { Language } from "@modules/Language";
import { CircleLoader } from "./circleLoader";

interface CircleLoaderFullSizeProps {
    text?: string
}
export default function CircleLoaderFullSize({
    text
}: CircleLoaderFullSizeProps) {
    return (
        <div className="circleLoaderFullSize">
            <CircleLoader type={"megabig"} color={"var(--tm-btn-disabled-txt)"} />
            <span className="title">{text || Language("PLEASE_WAIT")}</span>
        </div>
    )
}