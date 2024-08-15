import React from 'react'

import './index.scss'
import { Modal } from '@components/modals'
import UpdatesView from '@components/updatesView'
import UpdatesDTO from '@dto/updates.dto'

interface LastUpdateProps {
    updates: UpdatesDTO,
    onClose?(): void
}
export default function LastUpdate({
    updates,
    onClose
}: LastUpdateProps) {
    if(!updates.id)return
    return (
        <div id="lastUpdate">
            <Modal toggle={true} buttons={null} style={{ width: '850px' }}
                body={(<UpdatesView updates={updates} />)}
                onClose={() => {
                    if(onClose) onClose()
                }}
            />
        </div>
    )
}