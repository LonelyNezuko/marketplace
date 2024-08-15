import './index.scss'

interface DotsLoaderProps {
    size?: 'min' | 'normal' | 'medium' | 'big' | 'ultra',
    type?: 'dot-elastic' | 'dot-pulse' | 'dot-flashing' | 'dot-collision' | 'dot-revolution'
        | 'dot-carousel' | 'dot-typing' | 'dot-windmill' | 'dot-bricks' | 'dot-floating' | 'dot-fire' | 'dot-spin' | 'dot-falling' | 'dot-stretching',
    
    color?: 'white' | 'black' | 'colorful'
}
export default function DotsLoader({
    size = 'normal',
    type = 'dot-pulse',
    color = 'white'
}: DotsLoaderProps) {
    return (
        <div className={`dotsLoader size-${size} color-${color}`}>
            <div className={`loader ${type}`}></div>
        </div>
    )
}