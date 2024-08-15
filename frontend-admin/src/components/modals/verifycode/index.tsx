import React from 'react'

import { Modal } from '..'
import CONFIG from '@config'

import { MdOutlineSecurity } from "react-icons/md";
import { Language } from '@modules/Language';
import InputCode from '@components/inputcode';
import ModalLoader from '../loader';
import { API } from '@modules/API';
import { isValidJSON } from '@modules/functions/isValidJSON';
import Input from '@components/input';
import { hideEmail } from '@modules/functions/hideEmail';
import { notify } from '@modules/Notify';

export interface ModalVerifyCodeData {
    type: 'email',
    email?: string
}

interface ModalVerifyCodeProps {
    id: string,
    data?: ModalVerifyCodeData
    
    length?: number,

    onSubmit?: (code?: string) => void,
    onClose?: () => void
}
export default function ModalVerifyCode({
    id,
    data = {
        type: 'email'
    },

    length = CONFIG.verifycodesDefaultCodeLength,

    onSubmit,
    onClose
}: ModalVerifyCodeProps) {
    React.useEffect(() => {
        if(id !== 'signin') sendCode()
    }, [])
    function sendCode() {
        API({
            url: '/defaultapi/service/verifycodes/create',
            type: 'post',
            data: {
                privilege: id,
                length,
                language: window.language
            }
        }).done(result => {
            if(result.statusCode !== 200) {
                setFailed(Language("VERIFYCODE_FAILED_NONE"))
                notify("(verifycode) /service/verifycodes/create: " + result.message, { debug: true })
            }
        })
    }

    const [ loader, setLoader ] = React.useState(false)
    const [ failed, setFailed ] = React.useState("")

    const [ code, setCode ] = React.useState<string>('')
    React.useEffect(() => {
        if(code.length === length) {
            if(id === "signin") {
                if(onSubmit) onSubmit(code)
                return
            }

            setLoader(true)
            API({
                url: '/defaultapi/service/verifycodes',
                type: 'get',
                data: {
                    forid: id,
                    code
                }
            }).done(result => {
                setFailed('')

                if(result.statusCode === 200) {
                    let verifycodes: any = window.localStorage.getItem('verifycodes')

                    if(verifycodes && isValidJSON(verifycodes)) verifycodes = JSON.parse(verifycodes)
                    else verifycodes = []

                    verifycodes.push(result.message)
                    window.localStorage.setItem('verifycodes', JSON.stringify(verifycodes))

                    setLoader(false)
                    if(onSubmit) onSubmit()
                }
                else {
                    setLoader(false)

                    if(result.message === "The code's lifetime has expired") {
                        setFailed(Language("VERIFYCODE_FAILED_EXPIRES"))
                    }
                    else if(result.message === 'The code is incorrect') {
                        setFailed(Language("VERIFYCODE_FAILED_INCORRECT"))
                    }
                }
            })
        }
    }, [code])

    let description = Language("VERIFYCODE_DESCRIPTION")
    if(data.type === 'email' && data.email) description = Language("VERIFYCODE_DESCRIPTION_EMAIL", null, null, hideEmail(data.email))

    if(loader)return (<ModalLoader />)
    return (
        <Modal id='modalVerifyCode' toggle={true} title={Language("VERIFYCODE_TITLE")} desciption={description}
            icon={(<MdOutlineSecurity />)}

            body={(
                <div className="form">
                    {failed ? (<div style={{display: 'flex', justifyContent: 'center', paddingBottom: '24px', color: 'var(--tm-color-red)', fontWeight: '600'}}>{failed}</div>) : ''}

                    {length === 6 ? (
                        <InputCode disabled={code.length === length ? true : false} length={length} onSubmit={(code: string) => setCode(code)} />
                    ) : (
                        <Input type={"text"} onInput={event => {
                            const value = (event.target as HTMLInputElement).value
                            if(value.length === length) setCode(value)
                        }} />
                    )}
                </div>
            )}
            onClose={onClose}
        />
    )
}