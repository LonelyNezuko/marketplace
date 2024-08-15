import React from 'react'
import $ from 'jquery'
import { useDropzone } from 'react-dropzone'

import './index.scss'
import { Alert } from '@components/alert'
import { Language } from '@modules/Language'
import Button from '@components/button'

import CONFIG from '@config'

interface UploadDropFile_File extends File {
    _splice?: boolean
}

interface UploadDropFileProps {
    id?: string,
    onLoad?(acceptedFiles: Array<UploadDropFile_File>): void,

    maxFiles?: number,
    filesLoaded?: number,

    types?: string | Array<string>,
    typesErrorMsg?: string,

    style?: React.CSSProperties,
    onlyButton?: boolean,

    inputTitle?: string,
    disabled?: boolean
}
export default function UploadDropFile({
    id,
    onLoad,

    maxFiles = 1,
    filesLoaded = 0,

    types,
    typesErrorMsg = null,

    style,
    onlyButton,

    inputTitle,
    disabled
}: UploadDropFileProps) {
    if(maxFiles > 10) maxFiles = 10

    function uploadFiles(acceptedFiles: Array<File>) {
        if(disabled)return
        if(onLoad) {
            const previewFilesLength = parseInt($(`#uploadDropFile-${id}`).attr('data-previewfileslength'))

            if(maxFiles > 1 && previewFilesLength >= maxFiles)return Alert(Language("UPLOAD_DROPFILE_MAXFILES_ERROR"))
            if(maxFiles >= 1) {
                if(types) {
                    acceptedFiles.map((item: UploadDropFile_File, i) => {
                        if(typeof types === 'string'
                            && !(new RegExp(types.replace('*', '.\*'))).test(item.type)) acceptedFiles.splice(i, 1)
                        
                        if(typeof types === 'object') {
                            let typesErrorsCount = 0
                            types.map(type => {
                                if(!(new RegExp(type.replace('*', '.\*'))).test(item.type)) typesErrorsCount ++
                            })
                            
                            if(typesErrorsCount >= types.length) {
                                item._splice = true
                            }
                        }

                        if(item.size >= CONFIG.maxFileSizeToUpload) acceptedFiles.splice(i, 1)
                    })

                    acceptedFiles = acceptedFiles.filter((item: UploadDropFile_File) => !item._splice)
                    if(!acceptedFiles.length)return Alert(typesErrorMsg || 'Types files error')
                }

                if(acceptedFiles.length + previewFilesLength > maxFiles) {
                    acceptedFiles = acceptedFiles.slice(0, (maxFiles - previewFilesLength))
                } 
            }

            onLoad(acceptedFiles)
        }
    }

    const onDrop = React.useCallback(uploadFiles, [])
    const {getRootProps, isDragActive} = useDropzone({  onDrop })

    if(window.isPhone || onlyButton)return (
        <div id={id && ('uploadDropFile' + '-' + id)} className={`uploadDropFileInput`} style={style} data-previewfileslength={filesLoaded}>
            <label className={`button button-size-normal button-type-fill ${disabled && 'button-disabled'}`} htmlFor={'uploadDropFileInput' + '-' + id}>
                <span className="buttonName">{inputTitle || Language("LOAD_FILES")}</span>
            </label>
            <input disabled={disabled} multiple={maxFiles > 1} type="file" id={'uploadDropFileInput' + '-' + id} onChange={event => {
                const files: Array<File> = []

                for(var i = 0; i < event.target.files.length; i ++) {
                    files.push(event.target.files.item(i))
                }
                uploadFiles(files)

                event.target.value = ""
            }} />
        </div>
    )
    return (
        <div id={id && ('uploadDropFile' + '-' + id)} className={`uploadDropFile ${isDragActive && 'dragActive'}`} style={style}
            {...getRootProps({
                
            })} data-previewfileslength={filesLoaded}>
            <div className="filesDragActive">
                <img src="/assets/other/uploadDropFile.png" />
                <section>
                    <h1>{Language("UPLOADDROPFILES_DRAG_ACTIVE_TITLE")}</h1>
                    <span>{Language('UPLOADDROPFILES_DRAG_ACTIVE_DESC')}</span>
                </section>
            </div>

            <div className="dropimage">
                <h1>{Language("UPLOADDROPFILES_NONEFILES_TITLE")}</h1>

                <Button name={Language("UPLOADDROPFILES_NONEFILES_DESC")} classname='uploadBtn' disabled={disabled} />
            </div>
        </div>
    )
}