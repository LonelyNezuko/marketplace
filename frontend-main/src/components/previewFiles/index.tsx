import React from 'react'

import './index.scss'
import ContextMenu, { ContextMenuListElement } from '../contextmenu'

import { FaFile } from "react-icons/fa";
import { CircleLoader } from '../circleLoader/circleLoader'
import { Language } from '@modules/Language'
import { formatImage } from '@modules/functions/formatImage';
import { StorageDTO } from '@dto/storage.dto';
import { notify } from '@modules/Notify';
import { copyToClipBoard } from '@modules/functions/copyToClipBoard';

export interface PreviewFilesFile extends File {
    className?: string,
    loader?: boolean
}
interface PreviewFilesContextListElement extends ContextMenuListElement {
    onSubmit?(file: PreviewFilesFile | StorageDTO | string, index: number): void
}

interface PreviewFilesProps {
    files: Array<PreviewFilesFile> | Array<StorageDTO> | Array<string>,
    context?: Array<PreviewFilesContextListElement>,

    hideDeleteBtn?: boolean,

    onDeleteFile?(file: PreviewFilesFile | StorageDTO | string, index: number): void
}
export default function PreviewFiles({
    files = [],
    context = [],

    hideDeleteBtn,
    onDeleteFile
}: PreviewFilesProps) {
    function DropDownMenuRender({ index, file }: { index: number, file: PreviewFilesFile | StorageDTO | string }) {
        let fileURL

        if(typeof file === 'string') fileURL = file
        else if((file as StorageDTO).id) fileURL = (file as StorageDTO).type === 'image' ? (file as StorageDTO).images[0].link : ''
        else if(file.type.indexOf('image/')) fileURL = URL.createObjectURL((file as PreviewFilesFile))

        function onContextClick(contextitem) {
            if(!context)return

            const element = context.find(item => item === contextitem)
            if(!element || !element.onSubmit)return

            return element.onSubmit(file, index)
        }

        const list = [ ...context ]

        list.push(fileURL ? { content: Language("PREVIEWFILES_IMAGE_CONTEXT_OPENBLANK"), link: fileURL, target: '_blank', bottom: context.length ? true : false } : null)
        list.push(fileURL && fileURL.indexOf('blob') === -1 ? { content: Language("PREVIEWFILES_IMAGE_CONTEXT_COPYLINK"), onClick: async () => {
            copyToClipBoard(fileURL)
            notify(Language("COPIED"))
        } } : null)

        if(!hideDeleteBtn) list.push({ content: Language("PREVIEWFILES_IMAGE_CONTEXT_DELETE", null, null, typeof file === 'string' || file.type.indexOf('image/') !== -1 ? Language("IMAGE") : Language("FILE")), color: 'var(--tm-color-red)', bottom: true, onClick: () => {
            if(onDeleteFile) onDeleteFile(file, index)
        } })

        return (
            <ContextMenu
                list={list}
                onElementClick={onContextClick}
            />
        )
    }

    return (
        <div className="previewfiles">
            {files.map((item: PreviewFilesFile | StorageDTO | string, i) => {
                let image: string

                if(typeof item === 'string') image = item
                else if((item as StorageDTO).id) image = (item as StorageDTO).type === 'image' ? (item as StorageDTO).images[0].link : ''
                else image = item.type.indexOf('image/') !== -1 ? URL.createObjectURL((item as PreviewFilesFile)) : ''

                return (
                    <div key={i} className={`previewfiles-file ${(item as PreviewFilesFile).className}`}>
                        {(item as PreviewFilesFile).loader ? (
                            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', top: '0', left: '0', width: '100%', height: '100%', background: 'var(--tm-modal-fullbg)' }}>
                                <CircleLoader />
                            </div>
                        ) : ''}

                        {typeof item !== 'string' ? item.type.indexOf('image/') !== -1 || item.type === 'image' ?
                            (<img src={formatImage(image, 180)} key={i} />) :
                            (<section className="file">
                                <FaFile />
                                <span>{item.name}</span>
                            </section>)
                        : (<img src={formatImage(image, 180)} key={i} />)}

                        {!(item as PreviewFilesFile).loader ? (<DropDownMenuRender index={i} file={item} />) : ''}
                    </div>
                )
            })}
        </div>
    )
}