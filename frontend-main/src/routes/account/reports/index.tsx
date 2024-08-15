import React from 'react'

import Moment from 'moment'
import 'moment/min/locales'

import './index.scss'

import { VscReport } from "react-icons/vsc";

import Table from '@components/table';
import { Link } from 'react-router-dom';
import { formatText } from '@functions/formatText';
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { Language } from '@modules/Language';
import { RouteAccountProps } from '..';
import SetRouteTitle from '@modules/SetRouteTitle';
import Button from '@components/button';
import { ModerationReportDTO } from '@dto/report.dto';
import ProductDTO from '@dto/product.dto';
import UserDTO from '@dto/user.dto';
import { API } from '@modules/API';
import { notify } from '@modules/Notify';
import PhoneHeaderTitle from '@components/phoneHeaderTitle';

export default function RouteAccountReports({
    account,
    loader
}: RouteAccountProps) {
    SetRouteTitle(Language("ROUTE_TITLE_ACCOUNT_REPORTS"))
    Moment.locale(window.language)

    const [ listLoader, setlistLoader ] = React.useState(false)
    const [ reports, setReports ] = React.useState<ModerationReportDTO[]>([])

    React.useMemo(() => {
        setlistLoader(true)
        API({
            url: '/defaultapi/user/report/list',
            type: 'get'
        }).done(result => {
            if(result.statusCode === 200) {
                setReports(result.message)
                setlistLoader(false)
            }
            else {
                notify("(account.reports) /user/report/list: " + result.message, { debug: true })
            }
        })
    }, [])

    if(loader || !account)return
    return (
        <div className="route" id="routeAccountReports">
            {window.isPhone ? (
                <PhoneHeaderTitle text={Language("REPORTS")} outBodyPadding={true} />
            ) : (
                <header className="header">
                    <h1 className="blocktitle">{Language("REPORTS")}</h1>
                </header>
            )}

            {/* <EmailVerify type={"report"} /> */}

            {listLoader || loader ? (
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '68px'}}>
                    <CircleLoader type={"big"} color={'var(--tm-color)'} />
                </div>
            ) : ''}

            {!listLoader && !loader ?
                !reports.length ? (
                    <div className="noreports">
                        <VscReport />
                        <h1>{Language("REPORTS_NONE")}</h1>
                    </div>
                ) : (
                    <div className="reportList">
                        <Table id="accountReportList" hiddentop={true} design={"new"}
                            ths={[
                                { content: Language("REPORT_TABLE_TITLE_ID") },
                                { content: Language("REPORT_TABLE_TITLE_THEME") },
                                { content: Language("REPORT_TABLE_TITLE_SUSPECT") },
                                { content: Language("REPORT_TABLE_TITLE_CREATEAT") },
                                { content: Language("REPORT_TABLE_TITLE_STATUS") },
                                { content: "" }
                            ]}
                            list={reports.map(report => {
                                return [
                                    { content: "#" + report.id },
                                    { content: report.reason },
                                    { content: (<Link to={report.type === 'product' ? ("?ad=" + report.productEntity.prodID) : "/profile/" + report.userEntity.id} target={report.type === 'user' ? '_blank' : null} className={'link report-type report-type-' + report.type}>{report.type === 'product' ? `${Language("PRODUCT")} #${report.productEntity.prodID}` : report.userEntity.name[0] + ' ' + report.userEntity.name[1]}</Link>) },
                                    { content: Moment(report.createAt).format('DD.MM.YYYY') },
                                    { content: (<span className={'report-status report-status-' + report.status}>{Language("REPORT_STATUS_NAME_" + report.status.toUpperCase())}</span>) },
                                    { content: (<Link to={"/account/reports/" + report.id}>
                                        <Button name={Language("OPEN")} style={{ width: '100%' }} />
                                    </Link>) }
                                ]
                            })}
                        />
                    </div>
                )
            : ''}
        </div>
    )
}


