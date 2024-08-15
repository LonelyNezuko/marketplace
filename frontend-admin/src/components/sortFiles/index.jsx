import { Link } from "react-router-dom"

export default function SortFiles({ files }) {
    files.map(item => {
        if(item.type === 'youtube') {
            if(item.src.indexOf('youtube.com') !== -1) item.src = item.src.substring(item.src.indexOf('?v=') + 3, item.src.length)
        }
    })

    return (
        <div className={`_sortFiles _sortFiles-${files.length}`}>
            {files.map((item, i) => {
                return (<div key={i} className="_sortFilesItem">
                    <Image image={item} />
                    <Youtube video={item} />
                </div>)
            })}
        </div>
    )
}

function Image({ image }) {
    if(image.type !== 'img')return
    return (
        <Link className={`_sortFilesItem_img`}>
            <img src={item.src} />
        </Link>
    )
}
function Youtube({ video }) {
    if(video.type !== 'youtube')return
    return (
        <iframe className="_sortFilesItem_video"
            src={`https://www.youtube.com/embed/${video.src}`}
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen></iframe>
    )
}