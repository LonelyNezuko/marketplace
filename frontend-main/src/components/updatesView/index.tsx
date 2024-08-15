import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'
import TextEditor from '../textEditor'
import Username from '../username'
import { Language } from '../../modules/Language'
import UpdatesDTO from '@dto/updates.dto'

interface UpdatesViewProps {
    updates: UpdatesDTO
}
export default function UpdatesView({
    updates
}: UpdatesViewProps) {
    Moment.locale(window.language)

    if(!updates)return
    return (
        <div className="updatesView">
            <div className="updateWrapper">
                <div className="updateBackground" style={{ backgroundImage: `url(${updates.background})` }}>
                    <div className="updateName">
                        {updates.name}
                        <span>v{updates.version}</span>
                    </div>
                </div>
                <div className="updateBody">
                    <TextEditor viewOnly={true} readOnly={true} value={updates.body} />
                    <div className="publishDate">
                        <span>{Language("PUBLISHDATE")}: {Moment(updates.publishDate).format('DD.MM.YYYY')}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}