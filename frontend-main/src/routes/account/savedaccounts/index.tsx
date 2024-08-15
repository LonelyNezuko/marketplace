import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import CONFIG from '@config'

import './index.scss'
import { RouteAccountProps } from '..'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import { Language } from '@modules/Language'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Button from '@components/button'
import { Modal } from '@components/modals'
import { FaQuestion } from 'react-icons/fa6'
import { SavedaccountDTO } from '@dto/savedaccount.dto'
import { isValidJSON } from '@modules/functions/isValidJSON'
import { Avatar } from '@components/avatar/avatar'
import Username from '@components/username'
import UserDTO from '@dto/user.dto'
import { hideEmail } from '@modules/functions/hideEmail'
import DotsLoader from '@components/dotsloader'
import { CustomStorage } from '@modules/CustomStorage'

export default function RouteAccountSavedaccounts({
    loader,
    account
}: RouteAccountProps) {
    Moment.locale(window.language)
    const location = useLocation()

    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])
    
    const [ accountsList, setAccountsList ] = React.useState<SavedaccountDTO[]>([])
    const [ howsave, setHowsave ] = React.useState(false)

    React.useEffect(() => {
        if(location.hash.indexOf('#howsaveaccount') !== -1) setHowsave(true)
        else setHowsave(false)
    }, [location])
    React.useMemo(() => {
        let signinAccounts: SavedaccountDTO[] = new CustomStorage().get('signinAccounts')
        if(!signinAccounts) signinAccounts = []

        setAccountsList(signinAccounts)
    }, [])


    function onDeleteAccount(acc: SavedaccountDTO) {
        const savelist = accountsList.filter(item => acc !== item)

        new CustomStorage().set('signinAccounts', savelist)
        setAccountsList(savelist)
    }

    if(loader)return (
        <div style={{ width: '100%', height: '100%', display: 'flex', padding: '144px 0', justifyContent: 'center' }}>
            <DotsLoader size={"medium"} color={"colorful"} />
        </div>
    )
    return (
        <div className="route" id="routeAccountSavedaccounts">
            {howsave ? (
                <Modal toggle={true} title={Language("ACCOUNT_SAVEDACCOUNTS_HOWSAVE_TITLE")} icon={(<FaQuestion />)}
                    phoneHideBtn={true}
                    phoneVersion={true}
                
                    body={Language("ACCOUNT_SAVEDACCOUNTS_HOWSAVE_MODAL_BODY", null, null, CONFIG.maxSigninSaveAccounts)}

                    buttonsHref={[ "/account/savedaccounts" ]}
                    buttons={[ Language("CLOSE") ]}

                    modalBodyOverflow={"visible"}
                />
            ) : ''}

            {window.isPhone ? (
                <PhoneHeaderTitle outBodyPadding={true}
                    text={Language("ACCOUNT_SAVEDACCOUNTS_TITLE")}
                    description={Language("ACCOUNT_SAVEDACCOUNTS_TITLE_DESCRIPTION")}

                    links={accountsList.length && [ { url: '#howsaveaccount', name: Language("ACCOUNT_SAVEDACCOUNTS_HOWSAVE_TITLE") } ]}
                    linksWrap={true}
                />
            ) : (
                <header className="header">
                    <section className="section">
                        <h1 className="blocktitle">{Language('ACCOUNT_SAVEDACCOUNTS_TITLE')}</h1>
                        <span className="blockdesc">{Language("ACCOUNT_SAVEDACCOUNTS_TITLE_DESCRIPTION")}</span>
                    </section>
                    {accountsList.length ? (
                        <section className='section'>
                            <Link to={"#howsaveaccount"}>
                                <Button name={Language("ACCOUNT_SAVEDACCOUNTS_HOWSAVE_TITLE")} selected={howsave} type={"border"} />
                            </Link>
                        </section>
                    ) : ''}
                </header>
            )}

            <div className="list">
                {accountsList.map((acc, i) => {
                    return (
                        <div className="elem savedaccountelem" key={i}>
                            <section className="leftside">
                                <Avatar {...acc.avatar} circle={true} type={"medium"} />
                            </section>
                            <section className="rightside">
                                <div className="title">
                                    <Username account={acc as undefined as UserDTO} />
                                </div>
                                <div className="description">
                                    <span>{Language("ACCOUNT_SAVEDACCOUNTS_LIST_ELEM_DESCRIPTION_1", null, null, acc.id)}</span>
                                    <span>{Language("ACCOUNT_SAVEDACCOUNTS_LIST_ELEM_DESCRIPTION_2", null, null, hideEmail(acc.email))}</span>
                                    <span>{Language("ACCOUNT_SAVEDACCOUNTS_LIST_ELEM_DESCRIPTION_3", null, null, Moment(acc.lastSign || new Date(0)).calendar())}</span>
                                </div>
                                <div className="actions">
                                    <Button name={Language("ACCOUNT_SAVEDACCOUNTS_LIST_ELEM_ACTION_DELETE")} classname='delete' onClick={() => onDeleteAccount(acc)} />
                                </div>
                            </section>
                        </div>
                    )
                })}

                {!accountsList.length ? (
                    <div className="nolist">
                        <h6>{Language("ACCOUNT_SAVEDACCOUNTS_LIST_NOELEMS_TITLE")}</h6>
                        <Link to={"#howsaveaccount"}>
                            <Button name={Language("ACCOUNT_SAVEDACCOUNTS_HOWSAVE_TITLE")} selected={howsave} type={"hover"} size={"medium"} />
                        </Link>
                    </div>
                ) : ''}
            </div>

            <Navigate to={navigate} />
        </div>
    )
}