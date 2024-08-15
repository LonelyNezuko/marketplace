import $ from 'jquery'
import { random } from './functions/random'
import { isValidJSON } from './functions/isValidJSON'

import CONFIG from '../config.json'

interface Options {
    type?: null,
    time?: null,
    btnname?: null,
    btnloader?: boolean,

    onCreate?: Function | null,
    onBtnClick?: Function | null,

    debug?: boolean
}

export function notify(text: string, options: Options = {}) {
    const userDebugMode = window.localStorage.getItem('debugmode')
    if(options.debug && !userDebugMode)return

    const id = random(0, 9999999)
    if(options.type === 'btn'
        || options.type === 'btnbottom') {
        $('#notify').prepend(`
            <section id="notify-id-${id}" data-onbtnclick="${JSON.stringify({ func: options.onBtnClick })}">
                <div class="textbtn ${options.type === 'btnbottom' && 'btnbottom'}">
                    <span class="text">${text}</span>
                    <div class="action">
                        <button data-notifyid="${id}" class="btn transparent ${options.btnloader && 'loading'}">
                            <span>${options.btnname}</span>
                            ${options.btnloader ? `<div class='circleLoader'><span></span></div>` : ''}
                        </button>
                    </div>
                </div>
            </section>
        `)
    }
    else {
        $('#notify').prepend(`
            <section id="notify-id-${id}">
                <span className="text">${text}</span>
            </section>
        `)
    }

    $(`#notify #notify-id-${id} button.btn`).on('click', event => {
        if($(event.currentTarget).attr('disabled'))return
        options.onBtnClick({
            btnGoCircleLoader: () => {
                $(`#notify #notify-id-${id} button.btn`).addClass('loading')
                $(`#notify #notify-id-${id} button.btn`).append(`<div class='circleLoader'><span></span></div>`)
            },
            btnStopCircleLoader: () => {
                $(`#notify #notify-id-${id} button.btn`).removeClass('loading')
                $(`#notify #notify-id-${id} button.btn .circleLoader`).remove()
            },
            btnDisabled: (status) => {
                if(!status) $(`#notify #notify-id-${id} button.btn`).removeAttr('disabled')
                else $(`#notify #notify-id-${id} button.btn`).attr('disabled', 'disabled')
            }
        })
    })
    
    if(options.time !== 0) {
        setTimeout(() => {
            destroyNotify()
        }, options.time || 5000)
    }

    function destroyNotify() {
        $(`#notify #notify-id-${id} button.btn`).off('click')
        $(`#notify #notify-id-${id}`).addClass('animation')

        setTimeout(() => {
            $(`#notify #notify-id-${id}`).remove()
        }, 200)
    }

    if(options.onCreate) options.onCreate({
        target: $(`#notify #notify-id-${id}`),
        destroy: () => {
            destroyNotify()
        }
    })

    if(options.debug && userDebugMode) console.log("\x1b[31m NOTIFY DEBUG MODE: \x1b[39m" + text)
}