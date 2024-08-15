import React from 'react'

import './index.scss'
import { ModerationReportDTO } from '@dto/report.dto'
import { Language } from '@modules/Language'
import Button from '@components/button'
import { Link } from 'react-router-dom'

interface ReportCartProps {
    report: ModerationReportDTO
}
export default function ReportCart({
    report
}: ReportCartProps) {
    if(!report)return
    return (
        <div className="reportcart">
            <div className="reportcartWrapper">
                <h6 className="reportTitle">{Language("REPORT_NUMBER", null, null, report.id)}</h6>
                <div className="reportStatus">
                    <span>{Language("REPORT_TABLE_TITLE_STATUS")}:</span>
                    <span className={`report-status report-status-${report.status}`}>{Language("REPORT_STATUS_NAME_" + report.status.toUpperCase())}</span>
                </div>
                <div className="actions">
                    <Link to={"/account/reports/" + report.id}>
                        <Button name={Language("GO")} />
                    </Link>
                </div>
            </div>
        </div>
    )
}