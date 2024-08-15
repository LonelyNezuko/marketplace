import { Language } from "@modules/Language"
import LanguageDTO from "./language.dto"
import UserDTO from "./user.dto"

export default interface MailTemplateDTO {
    id: number
    type: MailTemplateTypes
    createAt: Date
    updateAt: Date
    creator: UserDTO
    updator: UserDTO
    language: LanguageDTO
    active: boolean
    html: string
    editorJSON: any
    subject: string
    _deleted?: boolean
}

export type MailTemplateTypes = "email-verify-code"
export type MailTemplateFormatValues = "username" | "link" | "companyname" | "code6length" | "date" | "servicename"

interface MailTemplateData {
    checkFormatValues: (html: string, type: MailTemplateTypes) => boolean

    mailTemplateFormatValuesName: Record<MailTemplateFormatValues, string>
    mailTemplateTypesFormatValues: Record<MailTemplateTypes, Array<MailTemplateFormatValues>>
    mailTemplateTypesName: Record<MailTemplateTypes, string>
    mailTemplateTypesNameArray: [MailTemplateTypes, string][]
}
export const mailTemplateData: MailTemplateData = {
    checkFormatValues: (html: string, type: MailTemplateTypes): boolean => {
        let status: boolean = true
        
        mailTemplateData.mailTemplateTypesFormatValues[type].map(key => {
            console.log(html.indexOf(`{${key}}`))
            if(html.indexOf(`{${key}}`) === -1) status = false
        })
    
        if(!status)return false
        return true
    },

    mailTemplateFormatValuesName: {
        "username": "MAILTEMPLATE_FORMAT_VALUES_NAME_USERNAME",
        "link": "MAILTEMPLATE_FORMAT_VALUES_NAME_LINK",
        "companyname": "MAILTEMPLATE_FORMAT_VALUES_NAME_COMPANYNAME",
        "code6length": "MAILTEMPLATE_FORMAT_VALUES_NAME_CODE6LENGTH",
        "date": "MAILTEMPLATE_FORMAT_VALUES_NAME_DATE",
        "servicename": "MAILTEMPLATE_FORMAT_VALUES_NAME_SERVICENAME",
    },
    
    mailTemplateTypesFormatValues: {
        'email-verify-code': [ 'username', 'link', 'companyname', 'servicename' ]
    },
    mailTemplateTypesName: {
        'email-verify-code': "MAILTEMPLATE_TYPE_VERIFYCODE"
    },
    mailTemplateTypesNameArray: [
        [ 'email-verify-code', "MAILTEMPLATE_TYPE_VERIFYCODE" ]
    ]
}