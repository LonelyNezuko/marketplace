import React from "react";
import { useSwipeable } from 'react-swipeable'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import ProductDTO from "@dto/product.dto";

import { MdFavorite } from 'react-icons/md'
import { MdFavoriteBorder } from 'react-icons/md'

import { TiInfoLarge } from "react-icons/ti";
import { HiDotsVertical } from "react-icons/hi";
import { Avatar } from "@components/avatar/avatar";
import Address from "@components/address";

import { FaArrowLeft } from "react-icons/fa6";
import { FaArrowRight } from "react-icons/fa6";
import { formatText } from "@modules/functions/formatText";
import { Link, useLocation } from "react-router-dom";

import { PiBookmarkSimpleBold, PiBookmarkSimpleFill, PiLinkSimpleBold } from "react-icons/pi";
import { isValidJSON } from "@modules/functions/isValidJSON";
import DropdownMenu from "@components/dropdownmenu";

import { MdOutlineReport } from "react-icons/md";
import { BiSolidCopy } from "react-icons/bi";

import { FaRegMessage } from "react-icons/fa6";
import { RouteErrorCodeProps } from "@routes/errorcodes";
import RouteProductOwnerData from "@routes/product/ownerData";
import RouteProductCharacteristics from "@routes/product/characteristics";
import RouteProductDescription from "@routes/product/description";
import { copyToClipBoard } from "@modules/functions/copyToClipBoard";
import { notify } from "@modules/Notify";
import { Language } from "@modules/Language";
import PhoneTopHide from "@components/phoneTopHide";
import { formatImage } from "@modules/functions/formatImage";
import { IoBookmarkSharp } from "react-icons/io5";
import Username from "@components/username";
import Button from "@components/button";
import RouteProduct from "@routes/product";
import { categoryGenerateLink } from "@modules/functions/categoryGenerateLink";
import { addProductFavorite } from "@components/adcart/addProductFavorite";
import { CustomStorage } from "@modules/CustomStorage";
import store from "@src/store";
import { reportModalShow } from "@src/store/reportModal";

interface FeedContainerProps {
    product: ProductDTO
}
export default function FeedContainer({
    product
}: FeedContainerProps) {
    const location = useLocation()
    Moment.locale(window.language)

    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0, text: '', showbtn: false })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const feedContainerRef = React.useRef(null)

    const [ imageSelected, setImageSelected ] = React.useState(0)
    const [ favorite, setFavorite ] = React.useState(false)

    const [ isDropdownShow, setIsDropdownShow ] = React.useState(false)

    const swipeImages = useSwipeable({
        onSwiped: event => {
            const direction  = event.dir
            if(direction === 'Left') {
                setImageSelected(old => {
                    if(old < product.prodImages.length - 1) old += 1
                    return old
                })
            }
            else if(direction === 'Right') {
                setImageSelected(old => {
                    if(old > 0) old -= 1
                    return old
                })
            }
        }
    })

    const [ sendMessageModal, setSendMessageModal ] = React.useState(false)

    function checkFavorite() {
        let favorites: number[] = new CustomStorage().get('favorites_ads')
        if(!favorites) favorites = []

        if(favorites.indexOf(product.prodID) !== -1) setFavorite(true)
        else setFavorite(false)
    }
    function onChangeFavorite() {
        if(addProductFavorite(product)) setFavorite(!favorite)
    }

    React.useMemo(() => {
        checkFavorite()
    }, [])

    return (
        <div className={`feedcontainer`} ref={feedContainerRef}>
            <div className="feedcontainer-owned">
                <div className="feedcontainer-owned-owner">
                    <Link to={`/profile/` + product.prodOwner.id} target={"_blank"} className="feedcontainer-owned-owner-leftside">
                        <Avatar {...product.prodOwner.avatar} onlinestatus={product.prodOwner.onlineStatus} />
                        <section className="feedcontainer-owned-owner-data">
                            <Username account={product.prodOwner} />
                            <span>{Moment(product.prodCreateAt).calendar()}</span>
                        </section>
                    </Link>

                    <div className="feedcontainer-owned-owner-actions">
                        <button className={`action-btn otherlist ${isDropdownShow && 'on'}`}>
                            <HiDotsVertical />

                            <DropdownMenu list={[
                                    window.userdata.uid !== product.prodOwner.id ? { content: Language("REPORTING"), icon: (<MdOutlineReport />), onClick: () => {
                                        store.dispatch(reportModalShow({ toggle: true, type: 'product', suspectID: product.prodID }))
                                    } } : null,
                                    { content: Language("COPY_LINK"), icon: (<BiSolidCopy />), onClick: () => {
                                        copyToClipBoard(window.location.origin + '/ad/' + product.prodID)
                                        notify(Language("COPIED"))
                                    } }
                                ]}

                                onToggleChange={toggle => setIsDropdownShow(toggle)}
                            />
                        </button>
                    </div>
                </div>

                <Link to={"?ad=" + product.prodID} className="feedcontainer-owned-wrap">
                    <div className="feedcontainer-owned-preview" {...swipeImages}>
                        <div className="feedcontainer-owned-preview-images">
                            <div className="feedcontainer-owned-preview-images-list">
                                <div className="imagewrap">
                                    <img src={formatImage(product.prodImages[0], 1920)} alt={product.prodTitle} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="feedcontainer-owned-bottom">
                    <div className="feedcontainer-owned-bottom-address">
                        <h5 className="title">{formatText(product.prodTitle, 35)}</h5>
                        <span className="address">{Address(product.prodGeo, true)}</span>
                        <span className="views">
                            {Language("FEEDCONTEINER_BOTTOM_VIEWS", null, null, product.prodViews)}
                            <Link target={"_blank"} to={categoryGenerateLink(product.prodCategory)} className="categoryname link">{product.prodCategory.categoryNameTranslate[window.language] || product.prodCategory.categoryName}</Link>
                        </span>
                    </div>

                    <div className="feedcontainer-owned-bottom-actions">
                        <button className={`action-btn favorite ${favorite && 'on'}`} onClick={onChangeFavorite}>
                            {favorite ? (<PiBookmarkSimpleFill />) : (<PiBookmarkSimpleBold />)}
                            {/* <span>0</span> */}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}