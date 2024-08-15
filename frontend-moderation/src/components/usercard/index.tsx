import React from 'react'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import UserDTO, { UserModerationHistoryDTO } from '@dto/user.dto'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import DotsLoader from '@components/dotsloader'
import { API, APISync } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import { Avatar } from '@components/avatar/avatar'
import Username from '@components/username'
import Roletag from '@components/roletag'
import { formatImage } from '@modules/functions/formatImage'
import OnlineStatus from '@components/useronlinestatus'
import Button from '@components/button'
import { BsFillGeoAltFill, BsPlus } from 'react-icons/bs'
import { RoleGetHighIndex, RolePrivilegesVerify } from '@modules/RolePrivilegesVerify'
import Input from '@components/input'
import RoleDTO from '@dto/role.dto'
import { Alert } from '@components/alert'
import { MdAlternateEmail, MdOutlineNumbers, MdUpdate } from 'react-icons/md'
import Address from '@components/address'
import { Language } from '@modules/Language'
import ProductDTO, { enumProductModerationStatus, enumProductStatus } from '@dto/product.dto'
import { FaBan, FaBirthdayCake, FaGenderless, FaRegAddressBook, FaToggleOff, FaToggleOn } from 'react-icons/fa'
import { IoMdFemale, IoMdMale } from 'react-icons/io'
import { renderCurrencyIcon } from '@modules/functions/renderCurrencyIcon'
import { IoCartSharp } from 'react-icons/io5'
import { CircleLoader } from '@components/circleLoader/circleLoader'
import AdCart from '@components/adcart'
import { Link, Navigate } from 'react-router-dom'
import DropdownMenu from '@components/dropdownmenu'
import getProductStatusName from '@components/productcard/getProductStatusName'
import getProductModerationStatusName from '@components/productcard/getProductModerationStatusName'
import { Modal } from '@components/modals'
import { HiOutlineBan } from "react-icons/hi";
import { Select, SelectListObject } from '@components/select/select'
import ModalLoader from '@components/modals/loader'
import Calendar from 'react-calendar'
import { formatText } from '@modules/functions/formatText'

interface UserCardProps {
    userid: number
}
export default function UserCard({
    userid
}: UserCardProps) {
    Moment.locale(window.language)

    const [ loader, setLoader ] = React.useState(true)
    const [ loaderModal, setLoaderModal ] = React.useState(false)
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ reload, setReload ] = React.useState(false)

    const [ userInfo, setUserInfo ] = React.useState<UserDTO>(null)
    const [ userModerationHistory, setUserModerationHistory ] = React.useState<UserModerationHistoryDTO[]>([])

    React.useEffect(() => {
        if(reload) setReload(false)
        if(!reload) {
            if(!userid || isNaN(userid)) {
                return setErrorPage({ code: 400 })
            }

            setLoader(true)
            API({
                url: '/defaultapi/moderation/user',
                type: 'get',
                data: {
                    id: userid
                }
            }).done((result: APIResult) => {
                if(result.statusCode === 200) {
                    const userinfo: UserDTO = result.message.user
                    setUserInfo(userinfo)

                    const moderationHistory: UserModerationHistoryDTO[] = result.message.moderationHistory
                    setUserModerationHistory(moderationHistory)

                    setErrorPage({ code: 0 })
                    setLoader(false)
                }
                else {
                    setErrorPage({ code: result.statusCode })
                    notify("(usercard) /moderation/user: " + result.message, { debug: true })
                }
            })
        }
    }, [userid, reload])

    if(errorPage.code !== 0)return (<RouteErrorCode {...errorPage} classes={"flexcenter center"} />)
    if(loader)return (
        <div className='usercard flexcenter'>
            <DotsLoader color={"colorful"} />
        </div>
    )

    if(!userInfo)return
    return (
        <div className="usercard">
            <TopHeader userInfo={userInfo} setUserInfo={setUserInfo} setErrorPage={setErrorPage} setReload={setReload}
                loaderModal={loaderModal} setLoaderModal={setLoaderModal}
                setNavigate={setNavigate}
            />
            <MainInfo userInfo={userInfo} setUserInfo={setUserInfo} />
            <ModerationHistory userInfo={userInfo} setUserInfo={setUserInfo} userModerationHistory={userModerationHistory} />
            <Products userInfo={userInfo} setUserInfo={setUserInfo} />

            {loaderModal ? (<ModalLoader />) : ''}
            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}


interface BlockProps {
    userInfo: UserDTO,
    setUserInfo: React.Dispatch<React.SetStateAction<UserDTO>>,

    setErrorPage?: React.Dispatch<React.SetStateAction<RouteErrorCodeProps>>,
    setReload?: React.Dispatch<React.SetStateAction<boolean>>,
    setLoaderModal?: React.Dispatch<React.SetStateAction<boolean>>,
    setNavigate?: React.Dispatch<any>,

    loaderModal?: boolean,
    userModerationHistory?: UserModerationHistoryDTO[]
}


function ModerationHistory({
    userInfo,
    setUserInfo,

    userModerationHistory
}: BlockProps) {
    const [ additionalInfo, setAdditionalInfo ] = React.useState<UserModerationHistoryDTO>(null)

    return (
        <section className="historyblock">
            {additionalInfo ? (
                <Modal toggle={true} title={"Информация об истории"}
                    body={(
                        <div className='historyAdditionalInfo'>
                            <section className="section">
                                <h6>{Language("MODERATION_USERCARD_MODHISTORY_ADDITIONAL_MODAL_TITLE_1")}</h6>
                                <span>{Moment(additionalInfo.createAt).calendar()}</span>
                            </section>
                            <section className="section">
                                <h6>{Language("MODERATION_USERCARD_MODHISTORY_ADDITIONAL_MODAL_TITLE_2")}</h6>
                                <span>
                                    <Link target={'_blank'} className='link' to={"/users/" + additionalInfo.moderator.id}>
                                        <Username account={additionalInfo.moderator} />
                                    </Link>
                                </span>
                            </section>
                            <section className="section">
                                <h6>{Language("MODERATION_USERCARD_MODHISTORY_ADDITIONAL_MODAL_TITLE_3")}</h6>
                                <span className={`type-${additionalInfo.type}`}>
                                    {Language("USER_MODERATION_HISTORY_TYPE_NAME_" + additionalInfo.type.toUpperCase())}
                                </span>
                            </section>
                            {additionalInfo.expiresDate ? (
                                <section className="section">
                                    <h6>{Language("MODERATION_USERCARD_MODHISTORY_ADDITIONAL_MODAL_TITLE_4")}</h6>
                                    <span>{+new Date(additionalInfo.expiresDate) < +new Date() ? (
                                            <span className="null">{Language("ALREADY_EXPIRED")}</span>
                                        ) : Moment(additionalInfo.expiresDate).calendar()}
                                    </span>
                                </section>
                            ) : ''}
                            <section className="section">
                                <h6>{Language("MODERATION_USERCARD_MODHISTORY_ADDITIONAL_MODAL_TITLE_5")}</h6>
                                <span>{additionalInfo.comment}</span>
                            </section>
                        </div>
                    )}

                    buttons={[ Language("CLOSE") ]}
                    onClose={() => setAdditionalInfo(null)}

                    modalBodyOverflow={"auto"}
                />
            ) : ''}

            <h6 className="blocktitle">{Language("MODERATION_USERCARD_MODHISTORY_TITLE")}</h6>
            <div className="list">
                <div className="listHeader">
                    <span className='date'>{Language("MODERATION_USERCARD_MODHISTORY_ELEM_TITLE_1")}</span>
                    <span className='user'>{Language("MODERATION_USERCARD_MODHISTORY_ELEM_TITLE_2")}</span>
                    <span className='type'>{Language("MODERATION_USERCARD_MODHISTORY_ELEM_TITLE_3")}</span>
                    <span className='comment'>{Language("MODERATION_USERCARD_MODHISTORY_ELEM_TITLE_4")}</span>
                    <span className='expiresDate'>{Language("MODERATION_USERCARD_MODHISTORY_ELEM_TITLE_5")}</span>
                </div>

                {userModerationHistory.map((item, i) => {
                    return (
                        <div className='elem' key={i} onClick={() => setAdditionalInfo(item)}>
                            <div className="flexline">
                                <section className="section date">{Moment(item.createAt).calendar()}</section>
                                <section className="section user">
                                    <Link target={'_blank'} className='link' to={"/users/" + item.moderator.id}>
                                        <Username account={item.moderator} />
                                    </Link>
                                </section>
                                <section className="section type">
                                    <span className={`type-${item.type}`}>
                                        {Language("USER_MODERATION_HISTORY_TYPE_NAME_" + item.type.toUpperCase())}
                                    </span>
                                </section>
                                <section className="section comment">
                                    {formatText(item.comment, 18)}
                                </section>
                                <section className="section expiresDate">
                                    {!item.expiresDate ? (<span className="null">Нет</span>) :
                                    +new Date(item.expiresDate) < +new Date() ? (
                                        <span className="null">{Language("ALREADY_EXPIRED")}</span>
                                    ) : Moment(item.expiresDate).calendar()}
                                </section>
                            </div>
                        </div>
                    )
                })}

                {!userModerationHistory.length ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <span className="null">{Language("NO")}</span>
                    </div>
                ) : ''}
            </div>
        </section>
    )
}


function Products({
    userInfo,
    setUserInfo
}: BlockProps) {
    const navigationList = [
        { title: getProductStatusName(enumProductStatus.PRODUCT_STATUS_ACTIVE), count: userInfo.productsActiveCount, status: enumProductStatus.PRODUCT_STATUS_ACTIVE, moderationStatus: null },
        { title: getProductModerationStatusName(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING), count: userInfo.productsVerifyingCount, status: null, moderationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_VERIFYING },
        { title: getProductModerationStatusName(enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM), count: userInfo.productsProblemsCount, status: null, moderationStatus: enumProductModerationStatus.PRODUCT_MODERATION_STATUS_PROBLEM },
        { title: getProductStatusName(enumProductStatus.PRODUCT_STATUS_CLOSED), count: userInfo.productsClosedCount, status: enumProductStatus.PRODUCT_STATUS_CLOSED, moderationStatus: null },
        { title: getProductStatusName(enumProductStatus.PRODUCT_STATUS_FORGOT), count: userInfo.productsForgotCount, status: enumProductStatus.PRODUCT_STATUS_FORGOT, moderationStatus: null },
        { title: getProductStatusName(enumProductStatus.PRODUCT_STATUS_BANNED), count: userInfo.productsBannedCount, status: enumProductStatus.PRODUCT_STATUS_BANNED, moderationStatus: null },
        { title: getProductStatusName(enumProductStatus.PRODUCT_STATUS_DELETED), count: userInfo.productsDeletedCount, status: enumProductStatus.PRODUCT_STATUS_DELETED, moderationStatus: null },
    ]
    const [ nav, setNav ] = React.useState(0)

    const [ products, setProducts ] = React.useState<ProductDTO[][]>([])
    const [ productsViewAll, setProductsViewAll ] = React.useState<boolean[]>([])

    const [ loader, setLoader ] = React.useState(false)

    function load() {
        setLoader(true)
        API({
            url: '/defaultapi/moderation/product/list',
            type: 'get',
            data: {
                status: navigationList[nav].status,
                moderationStatus: navigationList[nav].moderationStatus,
                ownerID: userInfo.id,
                pagination: { page: 1, limit: productsViewAll[nav] ? navigationList[nav].count : 20 }
            }
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setProducts(old => {
                    old[nav] = result.message
                    return [...old]
                })

                if(productsViewAll[nav] !== true) {
                    setProductsViewAll(old => {
                        old[nav] = false
                        return [...old]
                    })
                }
                setLoader(false)
            }
            else {
                notify("(usercard) /porudct/list: " + result.message, { debug: true })
            }
        })
    }
    React.useEffect(() => {
        if(!products[nav]) load()
    }, [nav])

    return (
        <section className="products">
            <h6 className="blocktitle">{Language("PRODUCTS")}</h6>
            <ul className="blocknavigation">
                {navigationList.map((item, i) => {
                    if(item.status === enumProductStatus.PRODUCT_STATUS_DELETED
                        && !RolePrivilegesVerify("/moderation/product/delete", window.userdata.roles))return
                    
                    return (
                        <li className={nav === i && 'selected'} onClick={() => {
                            if(!loader) setNav(i)
                        }}>
                            <span>
                                {item.title}
                                {item.count > 0 && (<span>{item.count}</span>)}
                            </span>
                        </li>
                    )    
                })}
            </ul>

            <div className="products_list">
                {loader ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
                        <CircleLoader color='var(--tm-color)' type={"big"} />
                    </div>
                ) : ''}

                {!loader && products[nav] ? 
                    products[nav].map((prod, i) => {
                        return (
                            <div className="products_list_elem">
                                <AdCart product={prod} key={i} type={"vertical"} cartLink={"/users/" + userInfo.id + '/product/'} />
                            </div>
                        )
                    })
                : ''}

                {!loader && products[nav] && !productsViewAll[nav] && products[nav].length < navigationList[nav].count ? (
                    <div className="products_list_viewall" onClick={() => {
                        setProductsViewAll(old => {
                            old[nav] = true
                            return [...old]
                        })
                        load()
                    }}>
                        <Button name={Language("SHOW_ALL")} type={"hovertransparent"} />
                    </div>
                ) : ''}

                {!loader && products[nav] && !products[nav].length ? (
                    <div className="blocknotfound">
                        <section>
                            <img src="/assets/errorcodes/notfound.png" />
                            <h6>{Language("NOT_FOUND")}</h6>
                        </section>
                    </div>
                ) : ''}
            </div>
        </section>
    )
}


function MainInfo({
    userInfo,
    setUserInfo
}: BlockProps) {
    return (
        <section className="maininfo">
            <div className="maininfo_list">
                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_1")}</h6>
                        <span className="value">{userInfo.id}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#308483' }}>
                            <MdOutlineNumbers />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_2")}</h6>
                        <span className="value">{userInfo.email}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#10b1e8' }}>
                            <MdAlternateEmail />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_3")}</h6>
                        <span className="value">
                            {userInfo.emailVerify
                            ? (<span style={{ color: 'var(--tm-color-darkgreen)' }}>{Language("EMAIL_VERIFY")}</span>)
                            : (<span style={{ color: 'var(--tm-color-darkred)' }}>{Language("EMAIL_NO_VERIFY")}</span>)
                            }
                        </span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: userInfo.emailVerify ? 'var(--tm-color-darkgreen)' : 'var(--tm-color-darkred)' }}>
                            {!userInfo.emailVerify ? (<FaToggleOff />) : (<FaToggleOn />)}
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_4")}</h6>
                        <span className="value">
                            {Moment(userInfo.createAt).calendar()}
                            <span style={{ fontSize: '10px', color: 'var(--tm-txt-opacity)' }}>({Moment(userInfo.createAt).fromNow()})</span>
                        </span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#8485af' }}>
                            <MdUpdate />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_5")}</h6>
                        <span className="value">{(userInfo as any).regIP}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#8485af' }}>
                            <FaRegAddressBook />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_6")}</h6>
                        <span className="value">{Address((userInfo as any).regGeo)}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#8485af' }}>
                            <BsFillGeoAltFill />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_7")}</h6>
                        <span className="value">{Address(userInfo.geolocation)}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#8431ab' }}>
                            <BsFillGeoAltFill />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_8")}</h6>
                        <span className="value">{Language("GENDER_" + userInfo.gender)}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#514e9d' }}>
                            {userInfo.gender === -1 ? (<FaGenderless />) : userInfo.gender === 0 ? (<IoMdMale />) : (<IoMdFemale />)}
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_9")}</h6>
                        <span className="value">{!userInfo.birthDate ? Language("NOT_INSTALLED") : Moment(new Date(parseInt(userInfo.birthDate))).calendar()}</span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#696cfe' }}>
                            <FaBirthdayCake />
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_10")}</h6>
                        <span className="value">
                            {CONFIG.currencyList.find(item => item.code === userInfo.currency).name || Language("UNDEFINED")}
                            <span style={{ fontSize: '10px', color: 'var(--tm-txt-opacity)', transform: 'translateY(1px)' }}>{userInfo.currency}</span>
                        </span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#bfa42f' }}>
                            {renderCurrencyIcon(userInfo.currency)}
                        </div>
                    </section>
                </div>

                <div className="maininfo_list_elem">
                    <section className="section">
                        <h6 className="title">{Language("MODERATION_USERCARD_INFO_NAME_11")}</h6>
                        <span className="value">
                            {userInfo.productsCount}
                        </span>
                    </section>
                    <section className="section">
                        <div className="icon" style={{ background: '#988aef' }}>
                            <IoCartSharp />
                        </div>
                    </section>
                </div>
            </div>
        </section>
    )
}



function TopHeader({
    userInfo,
    setUserInfo,

    setErrorPage,
    setLoaderModal,
    setReload,
    setNavigate,

    loaderModal
}: BlockProps) {
    const [ rolesListToAdd, setRolesListToAdd ] = React.useState<RoleDTO[]>([])

    const [ addRoleModal, setAddRoleModal ] = React.useState(false)
    const [ addRoleModalBtnLoader, setAddRoleModalBtnLoader ] = React.useState<number>(-1)

    const [ actionModal, setActionModal ] = React.useState({
        toggle: false,
        type: 'ban',
        comment: {
            value: '',
            mark: null,
            error: null
        },
        expiresDate: new Date(+new Date() + 3600000 * 24)
    })

    React.useEffect(() => {
        function onAddRoleModalClosed(event) {
            if(!addRoleModal)return
            if($('.usercard .addrolemodal').is(event.target) || $('.usercard .addrolemodal').has(event.target).length
                || $('.usercard .addrolemodalopen').is(event.target) || $('.usercard .addrolemodalopen').has(event.target).length)return

            setAddRoleModal(false)
        }

        document.addEventListener('click', onAddRoleModalClosed)
        document.addEventListener('touchstart', onAddRoleModalClosed)
        document.addEventListener('wheel', onAddRoleModalClosed)

        return () => {
            document.removeEventListener('click', onAddRoleModalClosed)
            document.removeEventListener('touchstart', onAddRoleModalClosed)
            document.removeEventListener('wheel', onAddRoleModalClosed)
        }
    }, ['', addRoleModal])

    function onRemoveUserRole(role: RoleDTO) {
        if(addRoleModalBtnLoader !== -1
            || !role || !userInfo)return

        function setvisualrole(addrolelist = true) {
            if(addrolelist) {
                setRolesListToAdd(old => {
                    old.push(role)
                    old = old.sort((a, b) => a.index - b.index)

                    return [...old]
                })
            }

            setUserInfo(old => {
                old.roles = old.roles.filter(item => item.key !== role.key)
                return {...old}
            })
        }

        setAddRoleModalBtnLoader(-2)
        API({
            url: '/defaultapi/role/user/remove',
            type: 'delete',
            data: {
                userid: userInfo.id,
                key: role.key
            }
        }).done((result: APIResult) => {
            setAddRoleModalBtnLoader(-1)

            if(result.statusCode === 200) {
                setvisualrole()
            }
            else {
                if(result.message === 'You cannot delete this role from a user'
                    || result.message === 'Role with this Key not found') {
                    setvisualrole(false)
                    Alert(Language("MODERATION_USERCARD_EDITROLE_ERROR_1"))
                }
                else if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === 'This user does not have a role with such a key') setvisualrole()
                else notify("(usercard) /role/user/set: " + result.message, { debug: true })
            }
        })
    }
    function onAddUserRole(role: RoleDTO, btnindex: number) {
        if(addRoleModalBtnLoader !== -1
            || !addRoleModal
            || !role || !userInfo)return

        function setvisualrole(adduser = true) {
            setRolesListToAdd(old => {
                old = old.filter(item => item.key !== role.key)
                return [...old]
            })

            if(adduser) {
                setUserInfo(old => {
                    old.roles.push(role)
                    old.roles = old.roles.sort((a, b) => a.index - b.index)

                    return {...old}
                })
            }
        }

        setAddRoleModalBtnLoader(btnindex)
        API({
            url: '/defaultapi/role/user/set',
            type: 'put',
            data: {
                userid: userInfo.id,
                key: role.key
            }
        }).done((result: APIResult) => {
            setAddRoleModalBtnLoader(-1)

            if(result.statusCode === 200) {
                setvisualrole()
            }
            else {
                if(result.message === 'You cannot add this role to a user'
                    || result.message === 'Role with this Key not found') {
                    setvisualrole(false)
                    Alert(Language("MODERATION_USERCARD_EDITROLE_ERROR_1"))
                }
                else if(result.statusCode === 403) setErrorPage({ code: 403 })
                else if(result.message === 'This user already has such a role') setvisualrole(false)
                else notify("(usercard) /role/user/set: " + result.message, { debug: true })
            }
        })
    }

    React.useEffect(() => {
        if(userInfo) {
            API({
                url: '/defaultapi/role',
                type: 'get',
                data: {
                    moreindex: RoleGetHighIndex(window.userdata.roles).index
                }
            }).done((result: APIResult) => {
                if(result.statusCode === 200) {
                    let roles: RoleDTO[] = result.message
                    roles = roles.filter(role => {
                        if(userInfo.roles.find(item => item.key === role.key))return false
                        return true
                    })
                    
                    setRolesListToAdd(roles)
                }
                else notify("(usercard) roles/list: " + result.message, { debug: true })
            })
        }
    }, [userInfo])


    async function onActionModalSubmit() {
        if(!userInfo || loaderModal || actionModal.comment.mark !== 'accept' || !actionModal.toggle)return
        if((actionModal.type !== 'ban' && actionModal.type !== 'unBan'
            && actionModal.type !== 'reportBan' && actionModal.type !== 'unReportBan'
            && actionModal.type !== 'warn')
            || (userInfo.id === window.userdata.uid || RoleGetHighIndex(userInfo.roles).index <= RoleGetHighIndex(window.userdata.roles).index))return setActionModal({ ...actionModal, toggle: false, type: 'ban' })

        if(actionModal.comment.value.length < 10 || actionModal.comment.value.length > 512)return
        if((actionModal.type === 'ban' || actionModal.type === 'reportBan')
            && (+actionModal.expiresDate < +new Date() + 3600000 * 24 || +actionModal.expiresDate > +new Date() + CONFIG.maxExpiresDateForUserBan))return

        setLoaderModal(true)

        let result: APIResult
        let url: string = ''

        if(actionModal.type === 'ban' || actionModal.type === 'unBan') {
            if(!RolePrivilegesVerify("/moderation/user/ban", window.userdata.roles))return setActionModal({ ...actionModal, toggle: false })

            result = await APISync({
                url: '/defaultapi/moderation/user/ban',
                type: 'put',
                data: {
                    userid: userInfo.id,
                    comment: actionModal.comment.value,
                    expiresDate: actionModal.expiresDate
                }
            })
            url = '/defaultapi/moderation/user/ban'
        }
        else if(actionModal.type === 'reportBan' || actionModal.type === 'unReportBan') {
            if(!RolePrivilegesVerify("/moderation/user/ban/report", window.userdata.roles))return setActionModal({ ...actionModal, toggle: false })
            
            result = await APISync({
                url: '/defaultapi/moderation/user/ban/report',
                type: 'put',
                data: {
                    userid: userInfo.id,
                    comment: actionModal.comment.value,
                    expiresDate: actionModal.expiresDate
                }
            })
            url = '/defaultapi/moderation/user/ban/report'
        }
        else if(actionModal.type === 'warn') {
            if(!RolePrivilegesVerify("/moderation/user/warn", window.userdata.roles))return setActionModal({ ...actionModal, toggle: false })
            
            result = await APISync({
                url: '/defaultapi/moderation/user/warn',
                type: 'put',
                data: {
                    userid: userInfo.id,
                    comment: actionModal.comment.value
                }
            })
            url = '/defaultapi/moderation/user/warn'
        }

        setLoaderModal(false)
        
        if(result.statusCode === 200) {
            switch(actionModal.type) {
                case 'ban': {
                    Alert(Language("MODERATION_USERCARD_PUNISHMENT_SUCCESS_1", null, null, userInfo.id), 'success')
                    break
                }
                case 'reportBan': {
                    Alert(Language("MODERATION_USERCARD_PUNISHMENT_SUCCESS_2", null, null, userInfo.id), 'success')
                    break
                }
                case 'unReportBan': {
                    Alert(Language("MODERATION_USERCARD_PUNISHMENT_SUCCESS_3", null, null, userInfo.id), 'success')
                    break
                }
                case 'unBan': {
                    Alert(Language("MODERATION_USERCARD_PUNISHMENT_SUCCESS_4", null, null, userInfo.id), 'success')
                    break
                }
                case 'warn': {
                    Alert(Language("MODERATION_USERCARD_PUNISHMENT_SUCCESS_4", null, null, userInfo.id), 'success')
                    break
                }
            }

            setActionModal({ toggle: false, type: 'ban', expiresDate: new Date(+new Date() + 3600000 * 24), comment: { value: '', mark: null, error: null } })
            setReload(true)
        }
        else {
            if(result.statusCode === 404) setNavigate('/')
            else if(result.statusCode === 403 && result.message === 'You cannot punish this user') {
                Alert(Language("MODERATION_USERCARD_PUNISHMENT_ERROR_1"))
                setReload(true)
            }
            else if(result.statusCode === 403) setErrorPage({ code: 403 })
            else Alert(Language("MODERATION_USERCARD_PUNISHMENT_ERROR_ANY"))

            notify(`(usercard) ${url}: ${result.message}`, { debug: true })
        }
    }

    const [ sendEmailCodeSuccess, setSendEmailCodeSuccess ] = React.useState<string>(null)
    async function onSendEmailCode() {
        if(!userInfo || loaderModal)return
        if(+new Date(userInfo.lastSendModerationEmailCode) + CONFIG.coolDownToSendModerationEmailCode >= +new Date())return

        setLoaderModal(true)
        const result = await APISync({
            url: '/defaultapi/moderation/user/email/sendcode',
            type: 'post',
            data: {
                userid: userInfo.id
            }
        })

        setLoaderModal(false)
        if(result.statusCode === 200) {
            setSendEmailCodeSuccess(result.message)
            setUserInfo(old => {
                return {...old, lastSendModerationEmailCode: new Date()}
            })
        }
        else {
            if(result.statusCode === 403) setErrorPage({ code: 403 })
            else if(result.statusCode === 404) setNavigate('/')
            else if(result.message === 'The code has already been sent recently') Alert(Language("MODERATION_USERCARD_EMAILCODE_ERROR_1"))
            
            notify("(usercard) /moderation/user/email/sendcode: " + result.message, { debug: true })
        }
    }

    return (
        <section className="topheader">
            {sendEmailCodeSuccess ? (
                <Modal toggle={true} title={"Код был успешно отправлен"}
                    body={(
                        <div>
                            <span style={{ display: 'block', }}>{Language('MODERATION_USERCARD_EMAILCODE_SUCCESS_MODAL_BODY_1')}</span>
                            <span style={{ display: 'block', marginTop: '4px', color: 'var(--tm-txt-opacity)', fontSize: '12px', fontWeight: '600' }}>{Language("MODERATION_USERCARD_EMAILCODE_SUCCESS_MODAL_BODY_2")}</span>
                            <span style={{ display: 'block', marginTop: '18px', fontSize: '18px', color: 'var(--tm-color)', fontWeight: '700' }}>{sendEmailCodeSuccess}</span>
                        </div>
                    )}

                    buttons={[ Language("CLOSE") ]}
                    onClose={() => setSendEmailCodeSuccess(null)}

                    modalBodyOverflow={"visible"}
                />
            ) : ''}
            {actionModal.toggle ? (
                <Modal toggle={true} title={Language("INTERACTION")} icon={<FaBan />}
                    id='userActionModal'
                    body={(
                        <div className="userAction">
                            <div className="form">
                                <Select title={Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TITLE_1")} _type={actionModal.type}
                                    _list={[
                                        userInfo.banned ? { content: Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TYPE_1"), key: 'unBan' } : { content: Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TYPE_2"), key: 'ban' },
                                        userInfo.reportBanned ? { content: Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TYPE_3"), key: 'unReportBan' } : { content: Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TYPE_4"), key: 'reportBan' },
                                        { content: Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TYPE_5"), key: 'warn' },
                                    ]} version={2}
                                    onChange={(value: SelectListObject<string>) => {
                                        setActionModal({ ...actionModal, type: value.key })
                                    }}
                                />
                                <Input type={"textarea"} title={Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TITLE_2")}
                                    data={{ hint: "Максимум 512 символов", mark: actionModal.comment.mark, error: actionModal.comment.error }}
                                    value={actionModal.comment.value}
                                    onInput={event => {
                                        const value = (event.target as HTMLDivElement).innerText
                                        const result = { value, mark: 'accept', error: null }

                                        if(value.length) {
                                            if(value.length < 10 || value.length > 512) {
                                                result.mark = 'error'
                                                result.error = 'Длина комментария 10 - 512 символов'
                                            }
                                        }
                                        else result.mark = null

                                        setActionModal({ ...actionModal, comment: result })
                                    }}
                                />
                                
                                {actionModal.type === 'ban'
                                    || actionModal.type === 'reportBan' ? (
                                    <div className="calendar">
                                        <h6>
                                            <span>{Language("MODERATION_USERCARD_PUNISHMENT_MODAL_FORM_TITLE_3")}</span>
                                            <span>{Moment(new Date(actionModal.expiresDate)).format('DD MMM YYYY')}</span>
                                        </h6>
                                        <Calendar minDate={new Date(+new Date() + 3600000 * 24)} maxDate={new Date(+new Date() + CONFIG.maxExpiresDateForUserBan)}
                                            onChange={(date: Date) => {
                                                setActionModal({ ...actionModal, expiresDate: date })
                                            }}
                                            value={actionModal.expiresDate}
                                        />
                                    </div>
                                ) : ''}
                            </div>
                        </div>
                    )}

                    style={{ width: "500px" }}
                    modalBodyOverflow={"visible"}

                    buttons={[ Language("CANCEL"), Language("SUBMIT") ]}
                    buttonsBlock={actionModal.comment.mark !== 'accept'}

                    onClick={onActionModalSubmit}
                    onClose={() => setActionModal({ ...actionModal, toggle: false })}
                />
            ) : ''}

            <div className="background">
                <div className="imageblur">
                    <img src={formatImage(userInfo.avatar.image, 1920)} />
                </div>

                <div className="bottombackground">
                    <div className="avatarblock">
                        <Avatar {...userInfo.avatar} sizeImage={180} type={"megabig"} onlinestatus={userInfo.onlineStatus} circle={true} />
                        <div className="actions">
                            <Button name={"Действия"} type={"hover"} />
                            <DropdownMenu list={[
                                { content: "Открыть на сайте", link: CONFIG.mainLink + '/profile/' + userInfo.id, target: "_blank" },
                                userInfo.email && userInfo.emailVerify ? { content: +new Date(userInfo.lastSendModerationEmailCode) + CONFIG.coolDownToSendModerationEmailCode < +new Date() ? "Отправить код на почту" : "Недавно код уже отправляли", bottom: true, disabled: +new Date(userInfo.lastSendModerationEmailCode) + CONFIG.coolDownToSendModerationEmailCode >= +new Date(), onClick: onSendEmailCode } : null,
                                (userInfo.id !== window.userdata.uid && RoleGetHighIndex(userInfo.roles).index > RoleGetHighIndex(window.userdata.roles).index && RolePrivilegesVerify('/moderation/user/warn', window.userdata.roles)) ?
                                { content: "Выдать предупреждение", bottom: true, color: 'var(--tm-color-red)', onClick: () => {
                                    setActionModal({ ...actionModal, toggle: true, type: 'warn' })
                                } } : null,
                                (userInfo.id !== window.userdata.uid && RoleGetHighIndex(userInfo.roles).index > RoleGetHighIndex(window.userdata.roles).index && RolePrivilegesVerify('/moderation/user/ban/report', window.userdata.roles)) ?
                                { content: userInfo.reportBanned ? "Разблокировать репорт" : "Заблокировать репорт", color: 'var(--tm-color-red)', onClick: () => {
                                    setActionModal({ ...actionModal, toggle: true, type: userInfo.reportBanned ? 'unReportBan' : 'reportBan' })
                                } } : null,
                                (userInfo.id !== window.userdata.uid && RoleGetHighIndex(userInfo.roles).index > RoleGetHighIndex(window.userdata.roles).index && RolePrivilegesVerify('/moderation/user/ban', window.userdata.roles)) ?
                                { content: userInfo.banned ? "Разблокировать аккаунт" : "Заблокировать аккаунт", color: 'var(--tm-color-red)', onClick: () => {
                                    setActionModal({ ...actionModal, toggle: true, type: userInfo.banned ? 'unBan' : 'ban' })
                                } } : null,
                            ]} />
                        </div>
                    </div>
                    <div className="firstinfo">
                        <div className="username">
                            <section>
                                <Username account={userInfo} size={"big"} />
                                <OnlineStatus status={userInfo.onlineStatus} />
                            </section>

                            <section>
                                {userInfo.banned ? <span className="status banned">Заблокирован</span> : <span className="status">Активен</span>}
                                {userInfo.reportBanned ? <span className="status banned">Заблокирован репорт</span> : ''}
                            </section>
                        </div>
                        <div className="roleslist">
                            {!userInfo.roles.length ? (
                                <Roletag />
                            ) : ''}

                            {userInfo.roles.map((role, i) => {
                                return (<Roletag role={role} key={i} classes={RoleGetHighIndex(window.userdata.roles).index < role.index && role.key !== 'developer' ? 'deletebtn' : ''}
                                    onClick={() => onRemoveUserRole(role)}
                                />)
                            })}

                            <div className="addrole">
                                <Button classname='addrolemodalopen' selected={addRoleModal} icon={(<BsPlus />)} type={"hover"} onClick={() => setAddRoleModal(old => !old)} />

                                {addRoleModal ? (
                                    <div className="addrolemodal">
                                        <div className="search">
                                            <Input type={"text"} deleteLabel={true} data={{ placeholder: "Поиск..." }} onInput={event => {
                                                const value = (event.target as HTMLInputElement).value

                                                if(!value) $('.usercard .addrolemodal .list .elem').show()
                                                else {
                                                    rolesListToAdd.map((role, i) => {
                                                        const element = $(`.usercard .addrolemodal .list .elem:nth-child(${i + 1})`)
                                                        const rolename = element.attr('data-rolename')

                                                        if(rolename) {
                                                            if(rolename.indexOf(value) !== -1) element.show()
                                                            else element.hide()
                                                        }
                                                    })
                                                }
                                            }} />
                                        </div>
                                        <div className="list">
                                            {rolesListToAdd.map((role, i) => {
                                                return (
                                                    <div className="elem" key={i} data-rolename={role.nameTranslate[window.language] || role.name}>
                                                        <Roletag role={role} size={"min"} />
                                                        <Button icon={(<BsPlus />)} size={"big"} type={"hover"}

                                                            loader={addRoleModalBtnLoader === i}
                                                            loaderType={"min"}

                                                            disabled={addRoleModalBtnLoader !== -1}

                                                            onClick={() => onAddUserRole(role, i)}
                                                        />
                                                    </div>
                                                )
                                            })}

                                            {!rolesListToAdd.length ? (
                                                <div className="norolestoadd">
                                                    <span>Нет ролей для добавления</span>
                                                </div>
                                            ) : ''}
                                        </div>
                                    </div>
                                ) : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}