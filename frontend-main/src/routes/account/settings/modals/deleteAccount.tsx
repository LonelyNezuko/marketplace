import React from 'react'
import Cookies from 'universal-cookie';

import Moment from 'moment'
import 'moment/min/locales'

import { Language } from '@modules/Language';

import { Modal } from '@components/modals'

import { MdDeleteSweep, MdPassword } from "react-icons/md";
import Input from '@components/input';

import { RouteAccountSettings_modalProps } from './props';
import { Link, useLocation } from 'react-router-dom';
import { PiTextAlignLeftBold } from 'react-icons/pi';
import ModalLoader from '@components/modals/loader';
import { API } from '@modules/API';
import { APIResult } from '@modules/API/index.dto';
import { notify } from '@modules/Notify';
import { CustomStorage } from '@modules/CustomStorage';
import { AuthTokens } from '@modules/AuthTokens';

const reasonList = [
    { id: 'badservice', name: "Плохая работоспособность сервиса", description: (
        <span className='description' dangerouslySetInnerHTML={{__html: `Нам очень жаль, что Вы столкнулись с проблемами работоспособности нашего сервиса.\n\nМы каждый день стараемся над улучшением сервиса.\nВы можете <a href="#contactus" class='link'>сообщить нам</a> о проблеме, с которой столкнулись и мы в кротчайшие сроки постараемся исправить ее.`}}></span>
    ) },
    { id: 'idiot', name: "Я не нашел то, что искал", description: (
        <span className='description' dangerouslySetInnerHTML={{__html: `Нам очень жаль, что на нашем сервисе нет того, что Вы искали.\n\nМы улучшаем наши рекомендательные алгоритмы так,чтобы они подстраивались под каждого пользователя индивидуально.`}}></span>
    ) },
    { id: 'support', name: "Плохая поддержка", description: (
        <span className='description' dangerouslySetInnerHTML={{__html: `Нам очень жаль, что Вы столкнулись с таком проблемой.\n\nВы можете <a href="#contactus" class='link'>сообщить нам</a> о некомпетентной поддержке, которую Вы получили\nи мы обязательно проведем расследование, в ходе которого накажем всех виновных.`}}></span>
    ) },
    { id: 'moderation', name: "Плохая модерация", description: (
        <span className='description' dangerouslySetInnerHTML={{__html: `Нам очень жаль, что Вы столкнулись с проблемами модерации.\n\nВы можете <a href="#contactus" class='link'>сообщить нам</a> о проблеме, с которой Вы столкнулись\nи мы обязательно проведем расследование, в ходе которого накажем всех виновных и исправим работоспособность модерации.`}}></span>
    ) },
    { id: 'other', name: "Другое", description: null }
]

export default function RouteAccountSettings_modalDeleteAccount({
    account,
    onClose
}: RouteAccountSettings_modalProps) {
    Moment.locale(window.language)
    const location = useLocation()

    const [ loader, setLoader ] = React.useState(false)
    const [ disabled, setDisabled ] = React.useState(false)

    const [ reason, setReason ] = React.useState(false)
    const [ reasonChecked, setReasonChecked ] = React.useState(-1)
    const [ reasonForm, setReasonForm ] = React.useState({
        value: '',
        mark: null,
        error: null
    })

    const [ success, setSuccess ] = React.useState(false)

    function onSubmit() {
        if(loader || success || disabled || reasonChecked === -1)return
        if(reasonChecked === reasonList.findIndex(item => item.id === 'other') && reasonForm.mark !== 'accept')return setDisabled(true)

        setLoader(true)
        setDisabled(true)

        console.log({
            reason: reasonList[reasonChecked].id,
            reasonText: reasonForm.value
        })
        API({
            url: '/defaultapi/user/delete',
            type: 'delete',
            data: {
                reason: reasonList[reasonChecked].id,
                reasonText: reasonForm.value
            }
        }).done((result: APIResult) => {
            setLoader(false)
            setDisabled(false)

            if(result.statusCode === 200) {
                setSuccess(true)

                AuthTokens.clear()
            }
            else notify("(account.settings.modals.deleteAccount) /user/delete: " + result.message, { debug: true })
        })
    }

    React.useEffect(() => {
        if(reason && onClose) onClose()
    }, [location])
    React.useEffect(() => {
        if(reason && reasonChecked === reasonList.findIndex(item => item.id === 'other')) {
            if(reasonForm.value.length < 24 || reasonForm.value.length > 512) setDisabled(true)
            else setDisabled(false)
        }
    }, [reason, reasonChecked, reasonForm])

    if(success) {
        return (
            <Modal toggle={true} title={"Аккаунт был удален"} hideCloseBtn={true}
                icon={(<MdDeleteSweep />)}
                phoneHideBtn={true}
                phoneVersion={true}
                body={(
                    <div className="deleteAccountModal changePassword">
                        <div className="step3">
                            <span>Аккаунт был успешно удален.</span>
                            <span>Все объявления, сообщения и прочая информация об аккаунте удалена.</span>

                            <span className="description" style={{ marginTop: '24px' }}>Физическое удаление аккаунта произойдет {Moment(+new Date + 2592000000).calendar()}</span>
                            <span className="description">До этого момента Вы можете восстановить аккаунт через поддержку</span>
                        </div>
                    </div>
                )}
                buttons={[ Language("EXIT") ]}
                onClose={() => {
                    window.location.href = '/'
                }}

                modalBodyOverflow={"visible"}
            />
        )
    }
    if(loader)return (<ModalLoader text={"Удаляем аккаунт..."} />)
    if(reason) {
        return (
            <Modal id={"accountSettingsDeleteAccountModal"} toggle={true} title={"Удаление аккаунта"}
                icon={(<MdDeleteSweep />)}
                phoneHideBtn={true}
                phoneVersion={true}
                body={(
                    <div className="deleteAccountModal changePassword">
                        <div className="step2">
                            <h6>Что вызвало у Вас такое решение?</h6>
                            <span className='titleDescription'>Пожалуйста, выберите пункт из списка ниже, чтобы мы могли улучшить нас сервис:</span>

                            <ul>
                                {reasonList.map((item, i) => {
                                    return (
                                        <li key={i}>
                                            <div className="inputcheckbox">
                                                <div className="inputcheckboxwrap">
                                                    <input className='radio' id={`accountSettingsDeleteAccountModal_list_${i}`} type="radio" name="accountSettingsDeleteAccountModal_list" checked={reasonChecked === i} onChange={event => {
                                                        setReasonChecked(i)
                                                    }} />
                                                    <label htmlFor={`accountSettingsDeleteAccountModal_list_${i}`}>{item.name}</label>
                                                </div>
                                            </div>

                                            {item.id !== 'other' && reasonChecked === i ? item.description : ''}
                                            {item.id === 'other' && reasonChecked === i ? (
                                                <Input type={"textarea"} title={"Опишите, что повлияло на Ваше решение:"}
                                                    icon={<PiTextAlignLeftBold />}
                                                    data={{ mark: reasonForm.mark, error: reasonForm.error }}

                                                    value={reasonForm.value}
                                                    onInput={event => {
                                                        const value = event.target.value
                                                        const result = { value, mark: null, error: null }

                                                        if(value
                                                            && (value.length < 24 || value.length > 512)) {
                                                            result.mark = 'error'
                                                            result.error = "Длина должна быть 24 - 512 символов"
                                                        }
                                                        else if(value) result.mark = 'accept'

                                                        setReasonForm(result)
                                                    }}
                                                />
                                            ) : ''}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                modalBodyOverflow={"visible"}

                buttons={[ Language("BACK"), Language("DELETE") ]}
                buttonsBlock={disabled || reasonChecked === -1}

                onClose={isBtn => {
                    if(onClose) onClose()
                }}
                onClick={onSubmit}
            />
        )
    }
    return (
        <Modal id={"accountSettingsDeleteAccountModal"} toggle={true} title={"Удаление аккаунта"}
            icon={(<MdDeleteSweep />)}
            phoneHideBtn={true}
            phoneVersion={true}
            body={(
                <div className="deleteAccountModal changePassword">
                    <div className="step1">
                        <span>
                            {`Удаление аккаунта это серьезное решение!\nХорошо обдумайте свое действие, ведь восстановить аккаунт будет крайне сложно.\n\nПри удалении аккаунта Вы навсегда потеряете к нему доступ.\nВсе Ваши ранее созданные объявления, написанные сообщения, будут удалены.\n\nЕще раз хорошо подумайте перед тем, как нажать "Удалить"...`}
                        </span>
                    </div>
                </div>
            )}

            modalBodyOverflow={"visible"}

            buttons={[ Language("BACK"), Language("DELETE") ]}
            buttonsBlock={disabled}

            onClose={isBtn => {
                if(onClose) onClose()
            }}
            onClick={() => setReason(true)}
        />
    )
}