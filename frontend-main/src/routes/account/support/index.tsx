import React from 'react'
import $ from 'jquery'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import { VscReport } from "react-icons/vsc";

import Table from '@components/table';
import { Link } from 'react-router-dom';
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { Language } from '@modules/Language';
import { RouteAccountProps } from '..';
import SetRouteTitle from '@modules/SetRouteTitle';
import EmailVerify from '@components/emailVerify';
import Button from '@components/button'
import { API, APISync } from '@modules/API';
import { notify } from '@modules/Notify';
import { ConfigModerationSupportReason, ModerationSupportDTO, ModerationSupportType } from '@dto/support.dto';
import { Modal } from '@components/modals';

import CONFIG from '@config'
import { Select, SelectListObject } from '@components/select/select';
import Input from '@components/input';
import UserDTO from '@dto/user.dto';
import DotsLoader from '@components/dotsloader';
import UserCart, { UserCartLoader } from '@components/usercart';
import ProductDTO from '@dto/product.dto';
import { formatText } from '@modules/functions/formatText';
import { formatImage } from '@modules/functions/formatImage';
import { Alert } from '@components/alert'
import ModalLoader from '@components/modals/loader'
import { MdOutlineContactSupport } from 'react-icons/md'
import PhoneHeaderTitle from '@components/phoneHeaderTitle'
import store from '@src/store'

export default function RouteAccountSupports({
    account,
    loader
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_SUPPORTS"))
    Moment.locale(window.language)

    const [ listLoader, setlistLoader ] = React.useState(false)
    const [ reports, setReports ] = React.useState<ModerationSupportDTO[]>([])

    const [ createModal, setCreateModal ] = React.useState(false)

    React.useMemo(() => {
        setlistLoader(true)
        API({
            url: '/defaultapi/user/support/list',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setReports(result.message)
                setlistLoader(false)
            }
            else {
                notify("(account.supports) /user/support/list: " + result.message, { debug: true })
            }
        })
    }, [])

    if(loader || !account)return
    return (
        <div className="route" id="routeAccountSupports">
            {createModal ? (
                <CreateModal onClose={() => setCreateModal(false)} account={account} />
            ) : ''}

            {window.isPhone ? (
                <PhoneHeaderTitle text={Language("SUPPORTS")} outBodyPadding={true}
                    links={[
                        { name: Language("SUPPORT_CREATE_BTN"), onClick: () => setCreateModal(true) }
                    ]}
                />
            ) : (
                <section className="header">
                    <h1 className="blocktitle">{Language("SUPPORTS")}</h1>
                    <div className="actions">
                        <Button name={Language("SUPPORT_CREATE_BTN")} onClick={() => setCreateModal(true)} />
                    </div>
                </section>
            )}
            
            {/* <EmailVerify type={"support"} /> */}

            {listLoader || loader ? (
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '68px'}}>
                    <CircleLoader type={"big"} color={'var(--tm-color)'} />
                </div>
            ) : ''}

            <div className="wrapper" style={{ marginTop: '18px' }}>
                {!listLoader && !loader ?
                    !reports.length ? (
                        <div className="noreports">
                            <VscReport />
                            <h1>{Language("SUPPORT_NONE")}</h1>
                        </div>
                    ) : (
                        <div className="reportList">
                            <Table id="accountSupportList" hiddentop={true} design={"new"}
                                ths={[
                                    { content: Language("SUPPORT_TABLE_TITLE_ID") },
                                    { content: Language("SUPPORT_TABLE_TITLE_THEME") },
                                    { content: Language("SUPPORT_TABLE_TITLE_CREATEAT") },
                                    { content: Language("SUPPORT_TABLE_TITLE_STATUS") },
                                    { content: "" }
                                ]}
                                list={reports.map(report => {
                                    return [
                                        { content: "#" + report.id },
                                        { content: report.reason },
                                        { content: Moment(report.createAt).format('DD.MM.YYYY') },
                                        { content: (<span className={'report-status report-status-' + report.status}>{Language("REPORT_STATUS_NAME_" + report.status.toUpperCase())}</span>) },
                                        { content: (<Link to={"/account/support/" + report.id}>
                                            <Button name={Language("OPEN")} style={{ width: '100%' }} />
                                        </Link>) }
                                    ]
                                })}
                            />
                        </div>
                    )
                : ''}
            </div>
        </div>
    )
}


let searchAccountTimer: NodeJS.Timeout = null

interface ICreateModal {
    onClose: () => void,
    account: UserDTO
}
function CreateModal({
    onClose,
    account
}: ICreateModal) {
    const [ form, setForm ] = React.useState<{
        type: ModerationSupportType
        body: {
            value: string
            mark: string
            error: string
        }

        product: ProductDTO
        user: UserDTO
    }>({
        type: null,
        body: {
            value: "",
            mark: null,
            error: null
        },

        product: null,
        user: null
    })

    const [ createLoader, setCreateLoader ] = React.useState(false)
    const [ createSuccess, setCreateSuccess ] = React.useState<number>(null)

    const [ products, setProducts ] = React.useState<ProductDTO[]>([])
    const [ productsLoader, setProductsLoader ] = React.useState(false)
    const [ productsPage, setProductsPage ] = React.useState(1)
    const [ productsLoadDisable, setProductsLoadDisable ] = React.useState(false)

    async function loadProducts() {
        if(productsLoadDisable)return
        setProductsLoader(true)

        const result = await APISync({
            url: '/defaultapi/product/list',
            type: 'get',
            data: {
                ownerID: account.id,
                pagination: { page: productsPage, limit: 30 }
            }
        })

        setProductsLoader(false)
        if(result.statusCode === 200) {
            if(!result.message.length) setProductsLoadDisable(true)
            else {
                setProducts(old => {
                    return [...old, ...result.message]
                })
                if(result.message.length < 30) setProductsLoadDisable(true)
            }
        }
        else {
            notify("(account.support.loadProducts) /product/list: " + result.message, { debug: true })
        }
    }

    const [ choiceKey, setChoiceKey ] = React.useState<string>(null)
    const [ choiceElem, setChoiceElem ] = React.useState<ConfigModerationSupportReason>(null)

    const [ searchAccountForm, setSearchAccountForm ] = React.useState<{
        value: string
        mark: string
        error: string
        loader: boolean
        notfound: boolean
    }>({
        value: "",
        mark: null,
        error: null,
        loader: false,
        notfound: false
    })
    async function findAccount(name: string) {
        if(!name || name.length < 2 || name.length > 48)return

        const result = await APISync({
            url: '/defaultapi/user/search/account',
            type: 'get',
            data: {
                name
            }
        })

        const state = { loader: false, notfound: false }
        if(result.statusCode === 200) {
            setForm(old => {
                return {...old, user: result.message}
            })
        }
        else {
            if(result.statusCode === 404) state.notfound = true
            else notify("(account.support.createModal) /user/search/account: " + result.message, { debug: true })
        }

        setSearchAccountForm(old => {
            return {...old, ...state}
        })
    }

    async function onSubmit() {
        if((form.type !== 'account' && form.type !== 'other' && form.type !== 'product')
            || !choiceElem || !choiceKey) {
            return Alert("Выберите причину обращения")
        }

        const choiceRenderResultList = choiceRenderList(choiceKey)[1]
        if(!choiceRenderResultList[choiceRenderResultList.length - 1]) {
            return Alert("Пройдите до конца по списку причин обращения")
        }

        if(choiceElem.selectProduct && !form.product) {
            return Alert("Выберите необходимо объявление")
        }
        if(choiceElem.searchAccount && !form.user) {
            return Alert("Найдите необходимого пользователя")
        }

        if(form.body.mark !== 'accept') {
            return Alert("Заполните поле 'Суть обращения'")
        }

        setCreateLoader(true)
        const result = await APISync({
            url: '/defaultapi/user/support',
            type: 'post',
            data: {
                text: form.body.value,
                reason: choiceElem.name,
                type: choiceElem.type,

                userID: form.user?.id,
                productID: form.product?.prodID
            }
        })

        setCreateLoader(false)
        if(result.statusCode === 200) {
            setCreateSuccess(result.message)
        }
        else {
            if(result.statusCode === 403 && result.message === 'You need to confirm your email') {
                return window.location.href = '/account/support'
            }
            else if(result.statusCode === 404 && result.message === 'Product not found') {
                Alert("Выбранное Вами объявление не было найдено.\nВозможно оно было удалено.")

                setProducts([])
                setProductsPage(1)
                setProductsLoadDisable(false)
                setProductsLoader(false)

                setForm({ ...form, product: null })
            }
            else if(result.statusCode === 404 && result.message === 'User not found') {
                Alert("Найденный Вами пользователь не был найден.\nПопробуйте еще раз")

                setSearchAccountForm({ value: '', mark: null, error: null, loader: false, notfound: false })
                setForm({ ...form, user: null })
            }
            else if(result.statusCode === 403 && result.message === 'Support has already been sent recently or there is a support with the same data') {
                Alert("Недавно Вы уже создавали обращение в поддержку. Попробуйте позже")
                onClose()
            }
            else if(result.statusCode === 500) {
                Alert("Внутренняя ошибка сервера")
                onClose()
            }
            else if(result.statusCode === 520) {
                Alert("Неизвестная внутренняя ошибка сервера")
                onClose()
            }

            notify("(account.support.submit) /user/support: " + result.message, { debug: true })
        }
    }

    function formatList(list: ConfigModerationSupportReason[]): SelectListObject[] {
        const result: SelectListObject[] = []
        
        if(list) list.map((item, i) => {
            result.push({
                key: Language(item.key),
                content: Language(item.name)
            })
        })

        result.unshift({
            key: null,
            content: "Выберите причину",
            hidden: true
        })
        return result
    }
    function formatListProducts(): SelectListObject[] {
        const resultList: SelectListObject[] = [ { key: null, content: Language("NOT_SELECTED"), hidden: true } ]

        products.forEach(item => {
            resultList.push({
                key: item.prodID,
                content: `#${item.prodID}: ${formatText(item.prodTitle, 20)}`,
                icon: (<img src={formatImage(item.prodImages[0], 45)} style={{ marginRight: '8px', objectFit: 'cover', borderRadius: '4px' }} />)
            })
        })

        if(productsLoader) resultList.push({ key: '_loader_', content: (<DotsLoader color={'colorful'} size={"min"} />) })
        return resultList
    }

    React.useEffect(() => {
        if(searchAccountTimer) {
            clearTimeout(searchAccountTimer)
            searchAccountTimer = null
        }

        if(searchAccountForm.value.length > 2 && searchAccountForm.mark === 'accept') {
            setSearchAccountForm(old => {
                return {...old, loader: true, notfound: false, account: null}
            })

            searchAccountTimer = setTimeout(() => findAccount(searchAccountForm.value), 300)
        }
        else {
            setSearchAccountForm(old => {
                return {...old, loader: false, notfound: false, account: null}
            })
        }
    }, [searchAccountForm.value])
    React.useEffect(() => {
        if(form.type === 'account'
            && !choiceElem.searchAccount) {
            setForm(old => {
                return { ...old, user: account }
            })
        }
        else {
            setForm(old => {
                return { ...old, user: null }
            })
        }
    }, [form.type, choiceElem])
    React.useEffect(() => {
        loadProducts()
    }, [productsPage])

    const [ emailVerify, setEmailVerify ] = React.useState(store.getState().emailVerifyReducer || null)
    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const emailVerifyState = store.getState().emailVerifyReducer
            if(emailVerifyState) setEmailVerify(emailVerifyState)
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])

    if(!emailVerify && window.userdata.uid !== -1)return (<EmailVerify type={"support"} modal={true} onModalClose={onClose} />)
    if(createSuccess)return (
        <Modal id='supportCreateModal' toggle={true} title={"Обращение в поддержку"} desciption={"Здесь Вы можете легко связаться с поддержкой и решить свой вопрос"}
            icon={<MdOutlineContactSupport />}

            body={"Обращение было успешно создано!"}
            modalBodyOverflow={"visible"}

            buttons={[ Language("CLOSE"), Language("OPEN") ]}
            buttonsHref={[ null, `/account/support/${createSuccess}` ]}

            onClose={onClose}

            phoneHideBtn={true}
            phoneVersion={true}
        />
    )
    if(createLoader)return (
        <ModalLoader text={"Создаем обращение"} toggle={true} />
    )
    return (
        <Modal id='supportCreateModal' toggle={true} title={"Обращение в поддержку"} desciption={"Здесь Вы можете легко связаться с поддержкой и решить свой вопрос"}
            icon={<MdOutlineContactSupport />}

            phoneHideBtn={true}
            phoneVersion={true}

            body={(
                <div className='supportCreateModalBody'>
                    <div className="reasonChoiceBlock">
                        {choiceRenderList(choiceKey)[0].map((item, i) => {
                            return (
                                <>
                                    <Select key={i} _type={choiceRenderList(choiceKey)[1][i]} _list={formatList(item)} version={2} onChange={(value: SelectListObject<string>) => {
                                        const elem = item.find(elem => elem.key === value.key)

                                        setChoiceKey(value.key)
                                        setForm({ ...form, type: elem.type })
                                        setChoiceElem(elem)
                                    }} />
                                </>
                            )
                        })}
                    </div>
                    {choiceElem ? (
                        <div className="reasonSubBlock">
                            {choiceElem.searchAccount ? (
                                <section className="searchAccountSection">
                                    <Input type={"text"} title={"Найдите аккаунт"}
                                        data={{ placeholder: "Введите имя и фамилию аккаунта", error: searchAccountForm.error, mark: searchAccountForm.mark as any }}
                                        value={searchAccountForm.value}
                                        onInput={event => {
                                            const value = (event.target as HTMLInputElement).value
                                            const result = { ...searchAccountForm, value, mark: 'accept', error: null }

                                            if(value.length) {
                                                if(value.length < 2 || value.length > 48) {
                                                    result.mark = 'error'
                                                    result.error = 'Недопустимый формат имени и фамилии'
                                                }
                                            }
                                            else result.mark = null

                                            setSearchAccountForm({...result})
                                        }}
                                    />
                                </section>
                            ) : ''}
                            {choiceElem.selectProduct ? (
                                <section className="searchProductSection">
                                    <Select title={"Выберите объявление"} _type={form.product ? form.product.prodID : null} _list={formatListProducts()} version={2}
                                        onToggle={toggle => {
                                            if(toggle && !products.length && !productsLoader) loadProducts()
                                        }}
                                        onChange={(value: SelectListObject) => {
                                            if(value.key === '_loader_')return

                                            const prod = products.find(item => item.prodID === value.key)
                                            if(prod) setForm({ ...form, product: prod })
                                        }}
                                        onScroll={event => {
                                            if(!productsLoadDisable && products.length >= 5) {
                                                const index = products.length - 2
                                                
                                                const containerElement = $(event.currentTarget).find(`.feedcontainer:nth-child(${index + 1})`)
                                                if(containerElement) setProductsPage(old => old + 1)
                                            }
                                        }}
                                    />
                                </section>
                            ) : ''}

                            <div className="accountFound">
                                {searchAccountForm.loader ? (
                                    <div className="loader">
                                        <UserCartLoader type={"mini"} />
                                    </div>
                                ) : ''}
                                {searchAccountForm.notfound ? (
                                    <div className="notfound">
                                        <img src="/assets/errorcodes/notfound.png" />
                                        <section>
                                            <span>Аккаунт не найден</span>
                                            <span>Проверьте, так ли Вы написали Имя Фамилию</span>
                                        </section>
                                    </div>
                                ) : ''}
                                {form.user && form.type === 'account' ? (
                                    <div className="account">
                                        <UserCart type={"mini"} account={form.user} linkTo={false} />
                                    </div>
                                ) : ''}
                            </div>
                        </div>
                    ) : ""}

                    <div className="bodyBlock">
                        <Input type={"textarea"} title={"Суть обращения"}
                            data={{ mark: form.body.mark as any, error: form.body.error }}
                            value={form.body.value}
                            onInput={event => {
                                const value = event.target.value
                                const result = { value, mark: 'accept', error: null }

                                if(value.length) {
                                    if(value.length < 10) {
                                        result.mark = 'error'
                                        result.error = 'Суть обращения должна быть минимум 10 символов'
                                    }
                                    if(value.length > 1024) {
                                        result.mark = 'error'
                                        result.error = 'Суть обращения не должна быть больше 1024 символов'
                                    }
                                }
                                else result.mark = null

                                setForm({ ...form, body: result })
                            }}
                        />
                    </div>
                </div>
            )}

            buttons={[ Language("CLOSE"), Language("SEND") ]}
            modalBodyOverflow={"visible"}

            onClick={onSubmit}
            onClose={onClose}
        />
    )
}


function choiceRenderList(currentKey: string): [ConfigModerationSupportReason[][], string[]] {
    const configList: ConfigModerationSupportReason[] = CONFIG.supportReasonList as ConfigModerationSupportReason[]
    if(!currentKey)return [[configList], [null]]

    const resultList: ConfigModerationSupportReason[][] = []
    const resultSelectedList: string[] = []

    function find(list: ConfigModerationSupportReason[]): [ConfigModerationSupportReason[][], string[]] {
        list.map(item => {
            if(item.key === currentKey) {
                resultList.push([...list])
                resultSelectedList.push(item.key)

                function parentFind(elem) {
                    const parent = elem._parent
                    if(parent) {
                        resultList.unshift([...parent])
                        
                        const l = parent.find(item => {
                            if(item.list) {
                                return item.list.find(l => l === elem)
                            }
                            return undefined
                        })
                        
                        if(l) {
                            resultSelectedList.unshift(l.key)
                            if(l._parent)return parentFind(l)
                        }
                    }
                }
                parentFind(item)

                if(item.list) {
                    resultList.push([...item.list])
                    resultSelectedList.push(null)
                }
            }
            else if(item.list) {
                item.list.map(e => (e as any)._parent = list)
                return find(item.list)
            }
        })
        return [resultList, resultSelectedList]
    }
    return find(configList)
}
// function getSelectedList(currentKey: string): string[] {
//     if(!currentKey)return []

//     let resultList: string[]
//     function find(list: ConfigModerationSupportReason[]): string[] {
//         list.map(item => {
//             if(item.key === currentKey) {
//                 resultList.push(item.key)
//             }
//             else {

//             }
//         })
//         return resultList
//     }
//     return find(CONFIG.supportReasonList as ConfigModerationSupportReason[])
// }