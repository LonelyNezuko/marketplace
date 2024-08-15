import React from 'react'

import './index.scss'
import Input from '@components/input'
import Button from '@components/button'
import { FaBan } from 'react-icons/fa'
import { Avatar } from '@components/avatar/avatar'
import { formatImage } from '@modules/functions/formatImage'
import Username from '@components/username'
import { Link } from 'react-router-dom'
import UserDTO from '@dto/user.dto'
import DotsLoader from '@components/dotsloader'
import { API } from '@modules/API'
import { APIResult } from '@modules/API/index.dto'
import { notify } from '@modules/Notify'
import { RouteErrorCode, RouteErrorCodeProps } from '@routes/errorcodes'
import { MdOutlineOpenInFull } from 'react-icons/md'

let searchTimer: NodeJS.Timeout

interface RouteUsersSearchformProps {
    onSubmit?: (account: UserDTO) => void,
    accountSelected?: number
}
export default function RouteUsersSearchform({
    onSubmit,

    accountSelected
}: RouteUsersSearchformProps) {
    const [ errorPage, setErrorPage ] = React.useState<RouteErrorCodeProps>({ code: 0 })

    const [ searchText, setSearchText ] = React.useState<string>('')
    const [ onlyBannedVisible, setOnlyBannedVisible ] = React.useState(false)

    const [ loader, setLoader ] = React.useState(false)
    const [ accountList, setAccountList ] = React.useState<UserDTO[]>([])

    const [ oneAccount, setOneAccount ] = React.useState<UserDTO>(null)

    function searchAccounts(text: string) {
        if(!text || !text.length || text.length < 3) {
            setLoader(false)

            if(oneAccount)return setAccountList([ oneAccount ])
            return setAccountList([])
        }

        setLoader(true)
        API({
            url: '/defaultapi/moderation/user/list',
            type: 'get',
            data: {
                name: text
            }
        }).done((result: APIResult) => {
            if(result.statusCode === 200) {
                setAccountList(result.message)
                setLoader(false)
            }
            else {
                if(result.statusCode === 403) setErrorPage({ code: 403 })
                else notify("(users) /moderation/user/list: " + result.message, { debug: true })
            }
        })
    }

    React.useEffect(() => {
        if(searchText.length >= 3) {
            if(searchTimer) {
                clearTimeout(searchTimer)
                searchTimer = null
            }

            searchTimer = setTimeout(() => {
                searchAccounts(searchText)

                clearTimeout(searchTimer)
                searchTimer = null
            }, 300)
        }
        else {
            setLoader(false)

            if(oneAccount) setAccountList([ oneAccount ])
            else setAccountList([])
        }
    }, [searchText])

    React.useEffect(() => {
        if(accountSelected && !isNaN(accountSelected)) {
            setLoader(true)
            API({
                url: '/defaultapi/moderation/user/list',
                type: 'get',
                data: {
                    id: accountSelected
                }
            }).done((result: APIResult) => {
                if(result.statusCode === 200) {
                    if(result.message.length) {
                        setOneAccount(result.message[0])
                        if(!searchText.length) setAccountList([ result.message[0] ])
                    }
                
                    setLoader(false)
                }
                else {
                    if(result.statusCode === 403) setErrorPage({ code: 403 })
                    else notify("(users) /moderation/user/list: " + result.message, { debug: true })
                }
            })
        }
        else {
            setOneAccount(null)
            if(!searchText.length) setAccountList([])
        }
    }, [accountSelected])

    if(errorPage.code !== 0)return (<RouteErrorCode {...errorPage} />)
    return (
        <div className="routeUsersSearchForm">
            <header className="header">
                <Input type={"text"} title={"Поиск"} data={{ placeholder: "Начните с Имени Фамилии..." }}
                    value={searchText}
                    onInput={event => {
                        const val = (event.target as HTMLInputElement).value
                        setSearchText(val)
                    }}
                />

                <div className="actions">
                    <Button icon={<FaBan />} size={"big"} selected={onlyBannedVisible} type={"hover"} hoverinfo={"Показывать только заблокированных"}
                        onClick={() => {
                            setOnlyBannedVisible(old => !old)
                        }}
                    />
                </div>
            </header>

            <div className="showbutton">
                <Link to={"/users/" + accountSelected}>
                    <Button icon={(<MdOutlineOpenInFull />)} type={"hover"} hoverinfo={"Открыть поиск"} />
                </Link>
            </div>

            <div className="list">
                {!loader && !searchTimer ? accountList.map((account, i) => {
                    return (
                        <Link to={"/users/" + account.id} className={`elem ${(accountSelected === account.id) && 'selected'}`} key={i}>
                            <section className="section">
                                <Avatar type={"medium"} image={formatImage(account.avatar.image, 90)} {...account.avatar} circle={true} />
                            </section>
                            <section className="section">
                                <div className="accountname">
                                    <Username account={account} />
                                    <span className="accountid">#{account.id}</span>
                                </div>
                                <div className="status">
                                    {/* <span className="banned">Заблокированн</span> */}
                                    <span>Действителен</span>
                                </div>
                            </section>
                        </Link>
                    )
                }) : ''}

                {!accountList.length && searchText.length >= 3 && !loader && !searchTimer ? (
                    <div className="ifnull">
                        <section>
                            <img src="/assets/errorcodes/notfound.png" />
                            <h6>Ничего не найдено</h6>
                            <span>По данному запросу аккаунтов не найдено</span>
                        </section>
                    </div>
                ) : ''}
                {!accountList.length && searchText.length < 3 && !loader ? (
                    <div className="ifnull">
                        <section>
                            <img src="/assets/errorcodes/write.png" />
                            <h6>Пусто</h6>
                            <span>Начните вводить запрос...</span>
                        </section>
                    </div>
                ) : ''}

                {loader ? (
                    <div className="loader">
                        <DotsLoader color={"colorful"} />
                    </div>
                ) : ''}
            </div>
        </div>
    )
}