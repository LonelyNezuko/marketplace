import React from 'react'
import $ from 'jquery'

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DeltaStatic, Sources } from 'quill'

import './index.scss'
import { Language } from '@modules/Language';

interface TextEditorProps {
    id?: string,
    bounds?: string | HTMLElement,
    placeholder?: string,

    value?: ReactQuill.Value,
    onChange?(value: string, delta: DeltaStatic, source: Sources, editor: ReactQuill.UnprivilegedEditor): void,

    readOnly?: boolean,
    viewOnly?: boolean

    height?: string | number,

    onGetHtml?(html: HTMLElement | JQuery<HTMLElement>): void
}
export default function TextEditor({
    id,
    bounds,
    placeholder,

    value,
    onChange,

    readOnly = false,
    viewOnly = false,

    height,

    onGetHtml
}: TextEditorProps) {

    const modules = {
        toolbar: [
            [{ 'font': [] }],
            [ { header: [ false, 1, 2, 3, 4, 5, 6] } ],
            [ 'bold', 'italic', 'underline', 'strike' ],
            [{ 'color': [] }, { 'background': [] }],
            [ 'blockquote', 'code-block' ],
            [ { list: 'ordered' }, { list: 'bullet' } ],
            [{ 'align': [] }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [ 'link', 'image' ]
        ]
    }

    placeholder = placeholder || Language("INPUT_HERE")
    if(viewOnly) {
        if(!value || !value.length) placeholder = Language("NOTHING")
        else placeholder = null
    }

    React.useEffect(() => {
        if(onGetHtml) onGetHtml($('#' + id + ' .ql-editor'))
    }, [value])

    return (
        <ReactQuill id={id} className={`_textEditor_ ${viewOnly && 'viewonly'}`} style={{ height: height }}
            theme='snow'
            placeholder={placeholder}

            readOnly={readOnly}
            
            value={value}
            onChange={onChange}
            
            modules={modules}
            bounds={bounds}
        />
    )
}

export function GetImagesFromText(element) {
    const images = []

    $(element).find('img').each((i, item) => {
        images.push($(item).attr('src'))
    })
    return images
}

export function ReplaceImagesFromText(text, images) {
    if(!images || !images.length)return

    images.map(item => {
        text = text.replace(item[0], item[1])
    })
    return text
}