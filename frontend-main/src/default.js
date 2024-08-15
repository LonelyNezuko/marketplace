import $ from 'jquery'
import 'jquery-mousewheel'

$(document).ready(() => {
    $(document).on('input', '.textarea .textareainput', event => {
        if(event.target.textContent.length) $(event.target).addClass('hideplaceholder')
        else $(event.target).removeClass('hideplaceholder')
    })

    $(document).on('paste', '[contenteditable]', event => {
        event.preventDefault();
        document.execCommand('inserttext', false, event.originalEvent.clipboardData.getData('text'))
    })
})