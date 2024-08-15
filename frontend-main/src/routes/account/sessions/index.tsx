import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import { RouteAccountProps } from '..'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import { Language } from '@modules/Language'
import { UserSessionsDTO } from '@dto/user.sessions.dto'
import { API, APISync } from '@modules/API'
import { notify } from '@modules/Notify'
import DotsLoader from '@components/dotsloader'
import { userAgentMobileTest } from '@modules/functions/userAgentMobileTest'
import { FaMobileAlt } from 'react-icons/fa'
import { FaDesktop } from 'react-icons/fa6'
import UAParser from 'ua-parser-js'
import Button from '@components/button'
import { HiStop } from 'react-icons/hi2'
import { MdLogout } from 'react-icons/md'
import { Modal } from '@components/modals'
import { divIcon } from 'leaflet'
import ModalLoader, { ModalLoaderProps } from '@components/modals/loader'
import { Alert } from '@components/alert'
import Address from '@components/address'

export default function RouteAccountSessions({
    loader,
    account
}: RouteAccountProps) {
    Moment.locale(window.language)

    const [ sessions, setSessions ] = React.useState<UserSessionsDTO[]>([])
    const [ sessionLoader, setSessionLoader ] = React.useState(true)

    const [ loaderModal, setLoaderModal ] = React.useState<ModalLoaderProps>({
        toggle: false,
        text: null
    })

    const [ clearSessionsModal, setClearSessionsModal ] = React.useState(false)
    const [ deleteSession, setDeleteSession ] = React.useState<UserSessionsDTO>(null)

    React.useEffect(() => {
        loadSessions()
    }, [])


    function loadSessions() {
        setSessionLoader(true)
        API({
            url: '/defaultapi/user/sessions/',
            type: 'get',
            data: {
                platform: 'site'
            }
        }).done(result => {
            if(result.statusCode === 200) {
                setSessions(result.message)
                setSessionLoader(false)
            }
            else notify("(account.sessions) /user/sessions: " + result.message, { debug: true })
        })
    }


    async function onDeleteSession() {
        if(!deleteSession || loader || !sessions || !account || loaderModal.toggle)return

        const session = deleteSession
        setDeleteSession(null)

        setLoaderModal({
            toggle: true,
            text: Language("ACCOUNT_SESSIONS_DELETE_LOADER_TEXT")
        })
        const result = await APISync({
            url: '/defaultapi/user/sessions',
            type: 'delete',
            data: {
                sessionID: session.sessionID
            }
        })

        setLoaderModal({
            toggle: false,
            text: null
        })

        if(result.statusCode === 200) {
            loadSessions()
            Alert(Language("ACCOUNT_SESSIONS_DELETE_SUCCESS"), "success")
        }
        else {
            if(result.message === 'Session not found') {
                loadSessions()
                Alert(Language("ACCOUNT_SESSIONS_DELETE_ERROR_1"))
            }
            else notify("(account.sessions) /user/sessions (delete): " + result.message, { debug: true })
        }
    }
    async function onClearSessions() {
        if(deleteSession || loader || !sessions || !account || loaderModal.toggle)return

        setClearSessionsModal(false)
        setLoaderModal({
            toggle: true,
            text: Language("ACCOUNT_SESSIONS_CLEAR_LOADER_TEXT")
        })

        const result = await APISync({
            url: '/defaultapi/user/sessions/clear',
            type: 'delete'
        })

        setLoaderModal({
            toggle: false,
            text: null
        })

        if(result.statusCode === 200) {
            loadSessions()
            Alert(Language("ACCOUNT_SESSIONS_CLEAR_SUCCESS"), "success")
        }
        else notify("(account.sessions) /user/sessions/clear: " + result.message, { debug: true })
    }


    if(loader || !account || sessionLoader)return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '148px 0' }}>
            <DotsLoader color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="routeAccountSessions">
            {loaderModal.toggle ? (<ModalLoader {...loaderModal} />) : ''}

            {deleteSession ? (
                <Modal toggle={true} title={Language("ACCOUNT_SESSIONS_MODAL_DELETE_TITLE")} desciption={Language("ACCOUNT_SESSIONS_MODAL_DELETE_DESCRIPTION")}
                    icon={<MdLogout />}
                    body={(
                        <div className="deleteSession">
                            <Session session={deleteSession} />
                        </div>
                    )}
                    modalBodyOverflow={"visible"}

                    phoneHideBtn={true}
                    phoneVersion={true}

                    buttons={[ Language("NO"), Language("YES") ]}

                    onClose={() => setDeleteSession(null)}
                    onClick={onDeleteSession}
                />
            ) : ''}
            {clearSessionsModal ? (
                <Modal toggle={true} title={Language('ACCOUNT_SESSIONS_MODAL_CLEAR_TITLE')} desciption={Language("ACCOUNT_SESSIONS_MODAL_CLEAR_DESCRIPTION")}
                    icon={<MdLogout />}
                    body={Language("ACCOUNT_SESSIONS_MODAL_CLEAR_BODY")}
                    modalBodyOverflow={"visible"}

                    phoneHideBtn={true}
                    phoneVersion={true}

                    buttons={[ Language("NO"), Language("YES") ]}

                    onClose={() => setClearSessionsModal(false)}
                    onClick={onClearSessions}
                />
            ) : ''}

            {window.isPhone ? (
                <PhoneHeaderTitle outBodyPadding={true}
                    text={Language("ACCOUNT_SESSIONS_TITLE")}
                    description={Language("ACCOUNT_SESSIONS_DESCRIPTION")}
                />
            ) : (
                <header className="header">
                    <section className="section">
                        <h1 className="blocktitle">{Language("ACCOUNT_SESSIONS_TITLE")}</h1>
                        <span className="blockdesc">{Language("ACCOUNT_SESSIONS_DESCRIPTION")}</span>
                    </section>
                </header>
            )}

            <div className="sessionsBody">
                <div className="currentSession sessionsblock">
                    <h6 className="sessionsblockTitle">{Language("ACCOUNT_SESSIONS_CURRENT_TITLE")}</h6>
                    <div className="list">
                        {sessions.filter(item => item.isCurrent).map((session, i) => {
                            return (<Session session={session} key={i} />)
                        })}
                    </div>
                </div>
                <div className="otherSessions sessionsblock">
                    <h6 className="sessionsblockTitle">{Language("ACCOUNT_SESSIONS_OTHER_TITLE")}</h6>
                    <div className="list">
                        {sessions.filter(item => !item.isCurrent).map((session, i) => {
                            return (<Session session={session} key={i} setDeleteSession={setDeleteSession} />)
                        })}

                        {!sessions.filter(item => !item.isCurrent).length ? (
                            <div className="sessionsNotfound">
                                <img src="/assets/errorcodes/nothing.png" />
                                <span>{Language("ACCOUNT_SESSIONS_NOTFOUND_TEXT")}</span>
                            </div>
                        ) : ''}

                        {sessions.filter(item => !item.isCurrent).length ? (
                            <div className="sessionClear sessionElem">
                                <Button name={Language("ACCOUNT_SESSIONS_ACTION_CLEAR")} size={"medium"} type={"transparent"} icon={<MdLogout />} description={Language("ACCOUNT_SESSIONS_ACTION_CLEAR_DESCRIPTION")}
                                    onClick={() => setClearSessionsModal(true)}
                                />
                            </div>
                        ) : ''}
                    </div>
                </div>
            </div>
        </div>
    )
}


function Session({
    session,
    setDeleteSession
}: { session: UserSessionsDTO, setDeleteSession?: React.Dispatch<React.SetStateAction<UserSessionsDTO>> }) {
    const [ uaData, setUAData ] = React.useState<UAParser.IResult>(null)
    React.useMemo(() => {
        setUAData(new UAParser(session.sessionAgent).getResult())
    }, [])

    if(!uaData)return
    return (
        <div className="sessionElem nohover elem">
            <section className="side left">
                <div className="deviceIcon">
                    {userAgentMobileTest(session.sessionAgent) ? (
                        <FaMobileAlt />
                    ) : (
                        <FaDesktop />
                    )}
                </div>
                <div className="sessionInfo">
                    <div className="ocname">
                        <span>{uaData.os.name} {uaData.os.version}</span>
                    </div>
                    <div className="entrypoint">
                        <span>{Language("BROWSER")}: {uaData.browser.name}</span>
                        <span>{Language("ACCOUNT_SESSIONS_PLATFORM_NAME_" + session.sessionPlatform.toUpperCase())}</span>
                    </div>
                    <div className="otherinfo">
                        <span className="geolocation">{Address(session.sessionGeo, true)}</span>

                        {session.isCurrent ? (
                            <span className="isCurrent">{Language("ACTIVE")}</span>
                        ) : (
                            <span className="entrytime">
                                {Moment(session.sessionCreateAt).fromNow()}
                            </span>
                        )}
                    </div>
                </div>
            </section>
            <section className="side right">
                <div className="actions">
                    {!session.isCurrent && setDeleteSession ? (
                        <Button name={Language("ACCOUNT_SESSIONS_ACTION_DELETE")} type={"transparent"} size={"medium"} onClick={() => setDeleteSession(session)} />
                    ) : ''}
                </div>
            </section>
        </div>
    )
}