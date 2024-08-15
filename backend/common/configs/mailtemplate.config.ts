import { MailTemplateFormatValues, MailTemplateTypes } from "src/__service/mailtemplate/mailtemplate.dto"

interface CONFIG_MAILTEMPLATE_INTERFACE {
    mailTemplateTypesFormatValues: Record<MailTemplateTypes, Array<MailTemplateFormatValues>>
}

const CONFIG_MAILTEMPLATE: CONFIG_MAILTEMPLATE_INTERFACE = {
    mailTemplateTypesFormatValues: {
        'email-verify-code': [ 'username', 'link', 'companyname', 'servicename' ],
        'email-code': [ 'username', 'companyname', 'servicename', 'code6length' ],
        'change-email-verify': [ 'username', 'companyname', 'servicename', 'link' ],
        'notification': [ 'text' ]
    }
}

export default CONFIG_MAILTEMPLATE