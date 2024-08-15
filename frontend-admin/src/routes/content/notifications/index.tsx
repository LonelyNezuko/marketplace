import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import ModalLoader, { ModalLoaderProps } from '@components/modals/loader'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import SetRouteTitle from '@modules/SetRouteTitle'
import { Language } from '@modules/Language'
import DotsLoader from '@components/dotsloader'
import UserNotificationsDTO from '@dto/user.notifications.dto'
import { API } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import Table, { TableProperties } from '@components/table'
import Button from '@components/button'
import Username from '@components/username'
import { RolePrivilegesVerify } from '@modules/RolePrivilegesVerify'
import RouteContentNotifications_CreateModal from './create'
import { Avatar } from '@components/avatar/avatar'
import { Modal } from '@components/modals'
import { Alert } from '@components/alert'

interface RouteContentNotificationsProps {
    isCreate?: boolean
}
export default function RouteContentNotifications({
    isCreate
}: RouteContentNotificationsProps) {
    SetRouteTitle(Language("ADMIN_ROUTE_TITLE_CONTENT_NOTIFICATIONS"))
    Moment.locale(window.language)

    const location = useLocation()
    const params = useParams()

    const [ loader, setLoader ] = React.useState(true)
    const [ loaderModal, setLoaderModal ] = React.useState<ModalLoaderProps>({
        toggle: false,
        text: null
    })
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ readNotification, setReadNotification ] = React.useState<number>(null)


    const [ deleteModal, setDeleteModal ] = React.useState<number>(null)
    function onDeleteNotification() {
        setDeleteModal(null)
        if(deleteModal === null || !notifications.length || deleteModal > notifications.length)return

        const notf = notifications[deleteModal]
        if(+new Date(notf.viewAt) < +new Date) {
            return Alert(Language("ADMIN_CONTENT_NOTIFICATIONS_DELETE_ERROR_1"))
        }

        setLoaderModal({ toggle: true })
        API({
            url: '/defaultapi/admin/notifications/delete',
            type: 'delete',
            data: {
                notfid: notf.id
            }
        }).done((result: APIResult) => {
            setLoaderModal({ toggle: false })

            if(result.statusCode === 200) {
                loadNotifications()
                Alert(Language("ADMIN_CONTENT_NOTIFICATIONS_DELETE_SUCCESS"), "success")
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(content.notifications) /admin/notifications/delete: " + result.message, { debug: true })
            }
        })
    }

    
    const [ notifications, setNotifications ] = React.useState<UserNotificationsDTO[]>([])
    function loadNotifications() {
        setLoader(true)
        API({
            url: '/defaultapi/admin/notifications/list',
            type: 'get'
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setNotifications(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(content.notifications) /admin/notifications/list: " + result.message, { debug: true })
            }
        })
    }

    React.useEffect(() => {
        if(isCreate && !loader)return

        const id = parseInt(params.id)

        setReadNotification(id)
        if(id && !loader)return

        loadNotifications()
    }, [location])


    function RenderNotifyAttached(notify: UserNotificationsDTO) {
        const style: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }

        let product: React.JSX.Element = (<></>)
        let user: React.JSX.Element = (<></>)

        if(notify.attachedProduct) {
            product = (<Link target={"_blank"} className="link" to={CONFIG.moderationPanelLink + '/product/' + notify.attachedProduct.prodID}>
                <span style={{ fontWeight: "700", fontSize: "14px" }}>
                    {Language("PRODUCT")} #{notify.attachedProduct.prodID}
                </span>
            </Link>)
        }
        if(notify.attachedUser) {
            user = (<Link target={"_blank"} className="link" to={CONFIG.moderationPanelLink + '/user/' + notify.attachedUser.id}>
                <Username account={notify.attachedUser} />
            </Link>)
        }

        if(!notify.attachedProduct && !notify.attachedUser)return (<span style={{...style, color: 'var(--tm-txt-opacity)'}}>{Language("NOTHING")}</span>)
        return (<span style={style}>
            {product}
            {notify.attachedProduct && notify.attachedUser ? '/' : ''}
            {user}
        </span>)
    }


    if(errorPage.code !== 0)return (
        <RouteErrorCode style={{marginTop: "128px"}} code={errorPage.code} text={errorPage.text}
            showbtn={errorPage.showbtn} btnurl={errorPage.btnurl} btnname={errorPage.btnname}
            icon={errorPage.icon} />
    )
    if(loader)return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '84px 0' }}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )

    return (
        <div className="route" id="routeContentNotifications">
            {deleteModal !== null ? (
                <Modal toggle={true} title={Language("ADMIN_CONTENT_NOTIFICATIONS_DELETE_MODAL_TITLE")}
                    body={Language("ADMIN_CONTENT_NOTIFICATIONS_DELETE_MODAL_BODY")}
                    modalBodyOverflow={"visible"}

                    buttons={[ Language("NO"), Language("YES") ]}

                    onClose={(() => setDeleteModal(null))}
                    onClick={onDeleteNotification}
                />
            ) : ''}

            {isCreate || readNotification ? (<RouteContentNotifications_CreateModal
                loaderModal={loaderModal} setLoaderModal={setLoaderModal}
                setErrorPage={setErrorPage} setNavigate={setNavigate}
                readonly={readNotification}
            />) : ''}

            {loaderModal.toggle ? (
                <ModalLoader text={loaderModal.text} />
            ) : ''}

            <Table
                title={Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TITLE")}
                titleDescription={Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_DESCRIPTION")}
                actions={[(<Link to="/content/notifications/create">
                    <Button name={Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_ACTION_1")} type={"border"} />
                </Link>)]}
                ths={[
                    { content: Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TH_1") },
                    { content: Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TH_2") },
                    { content: Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TH_3") },
                    { content: Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TH_4") },
                    { content: Language("ADMIN_CONTENT_NOTIFICATIONS_TABLE_TH_5") },
                    { width: '120px' }
                ]}
                searchBy={"name"}
                list={notifications.map((notify, i): TableProperties[] => {
                    return [
                        { content: '#' + notify.id },
                        { content: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <Avatar image={notify.previewAvatar} sizeImage={45} size={100} position={{ x: 0, y: 0 }} circle={true} type={"min"} />
                                <span>{notify.name}</span>
                            </div>
                        ), value: notify.name, id: 'name' },
                        { content: (
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                                <Link target={"_blank"} className="link" to={CONFIG.moderationPanelLink + '/user/' + notify.creator.id}>
                                    <Username account={notify.creator} />
                                </Link>
                                <span>/ {Moment(notify.createAt).calendar()}</span>
                            </div>
                        ) },
                        { content: +new Date(notify.viewAt) < +new Date ? (<span style={{ textAlign: 'center', color: 'var(--tm-color-darkgreen)' }}>{Language("ADMIN_CONTENT_NOTIFICATIONS_ALREAD_SENDED")}</span>) : Moment(notify.viewAt).calendar() },
                        { content: RenderNotifyAttached(notify) },
                        { dropdown: [
                                { content: Language("OPEN"), link: '/content/notifications/' + notify.id },
                                RolePrivilegesVerify('/admin/notifications/delete', window.userdata.roles) && +new Date(notify.viewAt) > +new Date ? { content: Language("DELETE"), bottom: true, color: 'var(--tm-color-darkred)', onClick: () => setDeleteModal(i) } : null
                            ],
                            width: '120px'
                        }
                    ]
                })}
                design={"new"}
            />

            {navigate ? (<Navigate to={navigate} />) : ''}
        </div>
    )
}