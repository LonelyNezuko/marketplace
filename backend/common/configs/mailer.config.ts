const CONFIG_MAILER = {
    mailboxes: {
        noreply: {
            host: 'smtp.livemail.co.uk',
            port: '465',

            secure: true,
            
            auth: {
                user: 'noreply@iboot.uk',
                pass: 'hH$k6T@TaB&akWR'
            },

            _host: {
                from: 'noreply@iboot.uk'
            }
        },
        admin: {
            host: 'smtp.livemail.co.uk',
            port: '465',

            secure: true,
            
            auth: {
                user: 'admin@iboot.uk',
                pass: 't?Jy6v*g97XYrSx'
            },

            _host: {
                from: 'admin@iboot.uk'
            }
        }
    }
}

export type CONFIG_MAILER_BOXNAMES = 'noreply' | 'admin'

export default CONFIG_MAILER