import React from 'react'
import parseQuery from 'parse-query'

import './index.scss'
import { Navigate, useLocation } from 'react-router-dom'
import { formatText } from '@modules/functions/formatText'

export default function RouteSearchNotfound() {
    const location = useLocation()

    const [ searchValue, setSearchValue ] = React.useState<string>(null)
    React.useEffect(() => {
        const query: Record<string, any> = parseQuery(location.search)
        if(query.s) setSearchValue(query.s)
    }, [location])
    
    return (
        <div className="route" id="routeSearchNotfound">
            <div className="wrapper">
                <div className="icon">
                    <img src="/assets/other/searchNotfound.png" />
                </div>
                {/* <div className="title">
                    <h1>Не найдено</h1>
                </div> */}
                <div className="description">
                    {searchValue ? (
                        <span>По вашему запросу: <span>{formatText(searchValue, 64)}</span></span>
                    ) : (
                        <span>По Вашему запросу</span>
                    )}
                    <span>Мы не смогли ничего найти!</span>

                    <ul>
                        <h6>Попробуйте сделать следующее:</h6>

                        <li>Скорректируйте запрос по друому</li>
                        <li>Используйте другие ключевые слова</li>
                        <li>Используйте меньше слов в запросе</li>
                        <li>Исправьте ошибки в тексте, если они есть</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}