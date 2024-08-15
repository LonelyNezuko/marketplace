import React from 'react'
import $ from 'jquery'
import 'jquery.scrollto'

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import QuickPinchZoom, { make3dTransformValue } from "react-quick-pinch-zoom";

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import Button from '@components/button'
import { IoAlert, IoClose } from 'react-icons/io5'
import { StorageFileData } from '@dto/storage.dto'
import { API } from '@modules/API'
import { Alert } from '@components/alert'
import { notify } from '@modules/Notify'
import { formatImage } from '@modules/functions/formatImage'
import { useLocation } from 'react-router-dom'

import CONFIG_SERVER from '@config.server'
import UserCart from '@components/usercart'
import { AiFillCaretLeft, AiFillCaretRight } from 'react-icons/ai'
import { CustomStorage } from '@modules/CustomStorage'
import { BsThreeDotsVertical } from 'react-icons/bs'
import DropdownMenu from '@components/dropdownmenu'
import PhoneTopHide from '@components/phoneTopHide'
import { useSwipeable } from 'react-swipeable'

interface ModalAlbumImagesProps {
    fileKey: string
    onModalClose: () => void
}
export default function ModalAlbumImages({
    fileKey,
    onModalClose
}: ModalAlbumImagesProps) {
    Moment.locale(window.language)
    const location = useLocation()

    const modalRef = React.useRef(null)

    const [ error, setError ] = React.useState<number>(null)

    const [ loader, setLoader ] = React.useState(true)
    const [ fileData, setFileData ] = React.useState<StorageFileData>(null)

    const [ imageSelected, setImageSelected ] = React.useState(0)
    
    const [ mobileInfoShow, setMobileInfoShow ] = React.useState(false)
    const [ mobileInfoMore, setMobileInfoMore ] = React.useState(false)

    React.useEffect(() => {
        if(!mobileInfoShow) setMobileInfoMore(false)
    }, [mobileInfoShow])

    const [ alertInfoStatus, setAlertInfoStatus ] = React.useState(false)

    React.useMemo(() => {
        setLoader(true)
        API({
            url: '/defaultapi/service/storage/filedata/' + fileKey,
            type: 'get',
            data: {
                onlyImage: true
            }
        }).done(result => {
            setLoader(false)
            
            if(result.statusCode === 200) {
                const data: StorageFileData = result.message
                setFileData(data)

                const fileIndex = data.albumFiles.findIndex(item => item.key === fileKey)
                if(fileIndex !== -1) {
                    setImageSelected(fileIndex)
                    setTimeout(() => {
                        onImageSelect(fileIndex)
                    }, 100)
                }
            }
            else {
                if(result.statusCode === 404
                    || result.statusCode === 403
                    || result.statusCode === 400) {
                    setError(result.statusCode)
                }
                else {
                    notify("(modals.albumImages) /service/storage/filedata/" + fileKey + ": " + result.message, { debug: true })
                    onModalClose?.()
                }
            }
        })

        setAlertInfoStatus(new CustomStorage().get('modalAlbumImagesAlertInfoStatus') ? false : true)
    }, [])
    React.useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if(event.key === 'Escape') onModalClose?.()
            else if(event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                setImageSelected(old => {
                    if(event.key === 'ArrowRight' && old < fileData.albumLength - 1) old += 1
                    else if(event.key === 'ArrowLeft' && old > 0) old -= 1
                    
                    onImageSelect(old)
                    return old
                })   
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
        }
    }, ['', fileData, modalRef])

    function onImageSelect(index: number) {
        if(!modalRef.current)return

        const element = $(`.modal#modalAlbumImages .imageList .image:nth-child(${index + 1})`)
        $(modalRef.current).find('.imageList').scrollTo(element, {
            duration: 100
        })
    }
    const swipeImages = useSwipeable({
        onSwiped: event => {
            if(event.dir === 'Left') {
                setImageSelected(old => {
                    if(old < fileData.albumLength - 1) old += 1
                    onImageSelect(old)

                    return old
                })
            }
            else if(event.dir === 'Right') {
                setImageSelected(old => {
                    if(old > 0) old -= 1

                    onImageSelect(old)
                    return old
                })
            }
            
            if(event.dir === 'Up'
                && !mobileInfoShow) {
                setMobileInfoShow(true)
            }
        },

        delta: 15
    })

    function generateFileLink(fileKey: string): string {
        const apiURL = process.env.REACT_APP_DEFAULTAPI_URL || CONFIG_SERVER.PROXY_DEFAULTAPI_URL
        return apiURL + '/defaultapi/service/storage/' + fileKey
    }

    if(error)return (<ModalAlbumImagesError error={error} />)
    if(loader)return (<ModalAlbumImagesLoader />)

    if(!fileData)return
    return (
        <div className="modal" id='modalAlbumImages' ref={modalRef}>
            <section className="leftSection">
                {window.isPhone ? (
                    <header className="header">
                        <section className="section">
                            <div className="closebtn">
                                <Button icon={<IoClose />} type={"transparent"} size={"big"} onClick={() => {
                                    onModalClose?.()
                                }} />
                            </div>
                            <div className="title">
                                <h6>{imageSelected + 1} из {fileData.albumLength}</h6>
                            </div>
                        </section>
                        <section className="section">
                            <div className="actions closebtn">
                                <Button icon={<BsThreeDotsVertical />} type={"transparent"} onClick={() => setMobileInfoShow(!mobileInfoShow)} />
                            </div>
                        </section>
                    </header>
                ) : ''}

                <div className="imagePreview" {...swipeImages}>
                    <div className="wrapper" style={{ transform: `translateX(-${imageSelected * 100}%)` }}>
                        {fileData.albumFiles.map((file, i) => {
                            return (
                                <div className="image" key={i}>
                                    {!window.isPhone ? (<img src={generateFileLink(file.key)} className="blured" />) : ''}

                                    {imageSelected === i ? (
                                        <QuickPinchZoom onUpdate={updateAction => {
                                            $(`#modalAlbumImages .imagePreview .image:nth-child(${i + 1}) .previewImg`).css({ transform: make3dTransformValue(updateAction) })
                                        }} draggableUnZoomed={false}>
                                            <img className="previewImg" src={generateFileLink(file.key)} />
                                        </QuickPinchZoom>
                                    ) : (
                                        <img src={generateFileLink(file.key)} />
                                    )}

                                    {/* <QuickPinchZoom onUpdate={updateAction => {
                                        $(`#modalAlbumImages .imagePreview .image:nth-child(${i + 1}) .previewImg`).css({ transform: make3dTransformValue(updateAction) })
                                    }} draggableUnZoomed={false}>
                                        <img className="previewImg" src={generateFileLink(file.key)} />
                                    </QuickPinchZoom> */}
                                </div>
                            )
                        })}
                    </div>

                    {!window.isPhone && imageSelected > 0 ? (
                        <div className="arrow left" onClick={() => setImageSelected(old => {
                            old -= 1
                            onImageSelect(old)

                            return old
                        })}>
                            <AiFillCaretLeft />
                        </div>
                    ) : ''}
                    {!window.isPhone && imageSelected < fileData.albumLength - 1 ? (
                        <div className="arrow right" onClick={() => setImageSelected(old => {
                            old += 1
                            onImageSelect(old)

                            return old
                        })}>
                            <AiFillCaretRight />
                        </div>
                    ) : ''}
                </div>

                {alertInfoStatus && !window.isPhone ? (
                    <div className="alertinfo">
                        <div className="icon">
                            <IoAlert />
                        </div>
                        <div className="text">
                            {`Вы можете использовать стрелочки клавиатуры для переключения изображений.\nКликните 2 раза по изображению, чтобы увеличить его`}
                        </div>
                        <div className="close">
                            <Button icon={<IoClose />} type={"transparent"} onClick={() => {
                                setAlertInfoStatus(false)
                                new CustomStorage().set('modalAlbumImagesAlertInfoStatus', 1)
                            }} />
                        </div>
                    </div>
                ) : ''}
            </section>
            <section className={`rightSection ${mobileInfoShow && 'show'} ${mobileInfoMore && 'more'}`}>
                {!window.isPhone ? (
                    <div className="closebtn">
                        <Button icon={<IoClose />} type={"transparent"} size={"big"} onClick={() => {
                            onModalClose?.()
                        }} />
                    </div>
                ) : (
                    <PhoneTopHide onHide={() => setMobileInfoShow(false)}
                        onSwipeUp={() => setMobileInfoMore(true)}
                    />
                )}

                <div className="albumInfo">
                    <section>
                        <span>Изображений в альбоме</span>
                        <span>{fileData.albumLength} изображений</span>
                    </section>
                    <section>
                        <span>Дата загрузки</span>
                        <span>{Moment(fileData.albumFiles[imageSelected].albumCreateAt).calendar()}</span>
                    </section>
                    <section>
                        <span>Загрузил</span>
                        <UserCart account={fileData.owner} type={"mini"} />
                    </section>
                </div>
                <div className="imageList">
                    {fileData.albumFiles.map((file, i) => {
                        return (
                            <div className={`image ${imageSelected === i && 'selected'}`} key={i} onClick={() => {
                                setImageSelected(i)
                                if(window.isPhone && mobileInfoShow) setMobileInfoShow(false)
                            }}>
                                <img src={generateFileLink(file.key)} />
                            </div>
                        )
                    })}
                </div>
                
                {!window.isPhone ? (
                    <div className="actions">
                        <Button name={"Закрыть"} icon={<IoClose />} size={"medium"} type={"transparent"} onClick={() => {
                            onModalClose?.()
                        }} />
                    </div>
                ) : ''}
            </section>
        </div>
    )
}


function ModalAlbumImagesError({ error }: { error: number }) {
    return (
        <div className="modal" id='modalAlbumImages'>
            <section className="leftSection">
                
            </section>
            <section className="rightSection">
                <div className="imageList">

                </div>
                <div className="actions">
                    
                </div>
            </section>
        </div>
    )
}

function ModalAlbumImagesLoader() {
    return (
        <div className="modal" id='modalAlbumImages'>
            <section className="leftSection">
                
            </section>
            <section className="rightSection">
                <div className="imageList">

                </div>
                <div className="actions">
                    
                </div>
            </section>
        </div>
    )
}