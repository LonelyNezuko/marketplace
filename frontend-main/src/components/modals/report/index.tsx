import React from 'react'

import './index.scss'
import { Modal } from '..'
import { Language } from '@modules/Language'
import { MdReport } from 'react-icons/md'
import AdCart, { AdCartLoaderDiv } from '@components/adcart'
import Input from '@components/input'
import { Select, SelectListObject } from '@components/select/select'
import { Link, Navigate } from 'react-router-dom'
import ProductDTO from '@dto/product.dto'
import UserDTO from '@dto/user.dto'
import { API, APISync } from '@modules/API'
import { notify } from '@modules/Notify'
import UserCart, { UserCartLoader } from '@components/usercart'
import CONFIG from '@config'
import ModalLoader from '../loader'
import Button from '@components/button'
import EmailVerify from '@components/emailVerify'
import store from '@src/store'
import { reportModalHide } from '@src/store/reportModal'

export default function ModalReport() {
    const [ navigate, setNavigate ] = React.useState(null)
    React.useEffect(() => { if(navigate !== null) setNavigate(null) }, [navigate])

    const [ toggle, setToggle ] = React.useState(false)
    const [ reportType, setReportType ] = React.useState<'product' | 'user'>(null)
    const [ suspectID, setSuspectID ] = React.useState<number>(null)

    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const state = store.getState().reportModalReducer
            if(state) {
                setToggle(state.toggle)
                setReportType(state.type)
                setSuspectID(state.suspectID)
            }
        })

        return () => {
            storeUnsubscribe()
        }
    }, [])
    
    const [ form, setForm ] = React.useState({
        reason: null,
        text: {
            value: '',
            mark: null,
            error: null
        },
        rules: false
    })

    const [ entity, setEntity ] = React.useState<ProductDTO | UserDTO>(null)
    const [ loaderEntity, setLoaderEntity ] = React.useState(true)

    const [ btnDisabled, setBtnDisabled ] = React.useState(true)
    const [ btnLoader, setBtnLoader ] = React.useState(false)

    const [ sendLoader, setSendLoader ] = React.useState(false)
    const [ successModal, setSuccessModal ] = React.useState(false)

    const [ errorModal, setErrorModal ] = React.useState<string>(null)
    
    const [ emailVerify, setEmailVerify ] = React.useState(store.getState().emailVerifyReducer || false)
    React.useEffect(() => {
        const storeUnsubscribe = store.subscribe(() => {
            const emailVerifyState = store.getState().emailVerifyReducer
            if(emailVerifyState) setEmailVerify(emailVerifyState)
        })
        
        return () => {
            storeUnsubscribe()
        }
    }, [])
    React.useMemo(() => {
        if(toggle === true) {
            if(reportType === 'user' && suspectID === window.userdata.uid)return store.dispatch(reportModalHide())
            if(!window.jwtTokenExists) {
                setNavigate('#signin')
                return store.dispatch(reportModalHide())
            }
        }
    }, [toggle])

    React.useEffect(() => {
        if(toggle === true) {
            if(emailVerify === true && !entity) {
                setLoaderEntity(true)
                API({
                    url: reportType === 'product' ? '/defaultapi/product/' : '/defaultapi/user/profile',
                    type: 'get',
                    data: {
                        userid: reportType === 'user' ? suspectID : null,
                        prodID: reportType === 'product' ? suspectID : null
                    }
                }).done(result => {
                    if(result.statusCode === 200) {
                        if(reportType === 'product' && (result.message as ProductDTO).prodOwner.id === window.userdata.uid)return store.dispatch(reportModalHide())

                        setEntity(result.message)
                        setLoaderEntity(false)
                    }
                    else {
                        store.dispatch(reportModalHide())
                        notify("(modals.report) " + (reportType === 'product' ? '/defaultapi/product: ' : '/defaultapi/user/profile: ') + result.message, { debug: true })
                    }
                })
            }
        }
    }, [toggle, emailVerify, entity])
    React.useEffect(() => {
        if(form.reason && form.text.mark === 'accept' && form.rules === true) setBtnDisabled(false)
        else setBtnDisabled(true)
    }, [form])


    async function onSubmit() {
        if(!toggle || btnDisabled || loaderEntity || btnLoader || !reportType || !entity || emailVerify !== true)return

        const result = await APISync({
            url: '/defaultapi/user/report/',
            type: 'post',
            data: {
                userID: reportType === 'user' ? (entity as UserDTO).id : null,
                productID: reportType === 'product' ? (entity as ProductDTO).prodID : null,
                text: form.text.value,
                reason: form.reason
            }  
        })
        setSendLoader(false)

        if(result.statusCode === 200) {
            setSuccessModal(true)
        }
        else {
            if(result.statusCode === 403 && result.message === 'Recently, a complaint has already been created against this entity') {
                setErrorModal(reportType === 'user' ? "Недавно Вы уже жаловались на данного пользователя" : "Недавно Вы уже жаловались на данное объявление")
            }
            else {
                store.dispatch(reportModalHide())
                notify("(modals.report) /user/report: " + result.message, { debug: true })
            }
        }
    }

    if(!toggle)return (
        <>
            {navigate ? (<Navigate to={navigate} />) : ''}
        </>
    )
    if(window.userdata.reportBanned)return (
        <Modal toggle={true}
            body={(<span style={{ textAlign: 'center', display: 'flex', alignItems: 'center' }}>{Language("REPORT_SEND_MESSAGE_BLOCK_USER_REPORT_BANNED")}</span>)}
            modalBodyOverflow={"visible"}

            onClose={() => store.dispatch(reportModalHide())}
            buttons={[ Language("CLOSE") ]}
        />
    )

    if(emailVerify === false && window.userdata.uid !== -1)return (<EmailVerify type={'report'} modal={true} onModalClose={() => {
        store.dispatch(reportModalHide())
    }} />)

    if(sendLoader)return (<ModalLoader />)
    if(successModal)return (
        <Modal id='modalReport' toggle={true} title={Language("REPORT")} desciption={Language("REPORTMODAL_DESCRIPTION")}
            icon={<MdReport />}
            body={(
                <div id='modalReportBodySuccess'>
                    <img src="/assets/other/success.png" />
                    <section>
                        <h6>Спасибо за бдительность</h6>
                        <span>Мы обязательно рассмотрим Вашу жалобу и накажем нарушителя</span>
                    </section>
                    <section>
                        <span>Вы можете отслеживать статус жалобы в личном кабинете</span>
                        <Link to={"/account/reports"}>
                            <Button name={"Перейти"} type={"transparent"} onClick={() => store.dispatch(reportModalHide())} />
                        </Link>
                    </section>
                </div>
            )}

            buttons={[ Language("CLOSE") ]}
            onClose={() => store.dispatch(reportModalHide())}
        />
    )
    if(errorModal)return (
        <Modal id='modalReport' toggle={true} title={Language("REPORT")} desciption={Language("REPORTMODAL_DESCRIPTION")}
            icon={<MdReport />}
            body={(
                <div id='modalReportBodySuccess'>
                    <img src="/assets/other/error.png" />
                    <section>
                        <h6>Ошибка!</h6>
                        <span>{errorModal}</span>
                    </section>
                    <section></section>
                </div>
            )}

            buttons={[ Language("CLOSE") ]}
            onClose={() => store.dispatch(reportModalHide())}

            modalBodyOverflow={"visible"}
        />
    )

    if(!entity)return
    return (
        <Modal id='modalReport' toggle={true} title={Language("REPORT")} desciption={Language("REPORTMODAL_DESCRIPTION")}
            icon={<MdReport />}
            body={(
                <div id='modalReportBody'>
                    <section className="section reportTypeEntity">
                        <h6 className="sectionTitle">Жалоба на:</h6>
                        <div className="product">
                            {reportType === 'product' ?
                                (loaderEntity || !entity) ? (<AdCartLoaderDiv type={"horizontal"} size={"min"} />) : (<AdCart type={"horizontal"} size={"min"} product={entity as ProductDTO} />)
                                :
                                (loaderEntity || !entity) ? (<UserCartLoader type={"mini"} />) : (<UserCart type={"mini"} account={entity as UserDTO} />)
                            }
                        </div>
                    </section>
                    <section className="section reportReason">
                        <Select title={"Причина жалобы"} version={2}
                            _type={form.reason}
                            _list={[
                                { key: null, content: "Выберите причину жалобы", hidden: true },
                                ...CONFIG.reportReasonList[reportType].map(item => {
                                    return { key: item, content: item }
                                })
                            ]}

                            onChange={(value: SelectListObject<string>) => {
                                setForm({ ...form, reason: value.key })
                            }}
                        />
                    </section>
                    <section className="section reportText">
                        <Input type={"textarea"} title={"Текст жалобы"} maxLength={1024}
                            data={{
                                placeholder: "Пожалуйста, опишите почему Вы считаете, что данное объявление нарушает наши правила",
                                mark: form.text.mark, error: form.text.error,
                                hint: "Минимум 10 символов\nМаксимум символов: 1024"
                            }}
                            value={form.text.value}
                            onInput={event => {
                                const value = event.target.value.trim()
                                const result = { value, mark: 'accept', error: null }

                                if(value.length) {
                                    if(value.length < 10 || value.length > 1024) {
                                        result.mark = 'error'
                                        result.error = 'Минимум 10 символов, максимум 1024'
                                    }
                                }
                                else result.mark = null

                                setForm({ ...form, text: result })
                            }}
                        />
                    </section>
                    <section className="section reportRules">
                        <div className="inputcheckbox">
                            <div className="inputcheckboxwrap">
                                <input type="checkbox" id='modalReportCheckboxRules' checked={form.rules} onChange={() => setForm({ ...form, rules: !form.rules })} />
                                <label htmlFor="modalReportCheckboxRules">Я прочитал <Link to={"/"} className='link' target={"_blank"}>правила подачи жалоб</Link> и соглашаюсь с ними</label>
                            </div>
                        </div>
                    </section>


                    {navigate ? (<Navigate to={navigate} />) : ''}
                </div>
            )}

            buttons={[ Language("CANCEL"), Language("SEND") ]}
            buttonsBlock={btnDisabled}
            buttonLoader={btnLoader}

            onClick={onSubmit}
            onClose={() => store.dispatch(reportModalHide())}
        />
    )
}