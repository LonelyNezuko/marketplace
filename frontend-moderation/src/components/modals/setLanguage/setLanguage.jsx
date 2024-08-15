import React from 'react'
import { Link } from 'react-router-dom'
import Cookies from 'universal-cookie'

import './setLanguage.scss'

import { Select } from '../../select/select'

export function ModalSetLanguage({ defaultLang, onChange }) {
    const [ language, setLanguage ] = React.useState(defaultLang)
    const [ list, setList ] = React.useState([])

    React.useEffect(() => {
        setLanguage([ defaultLang ])
    }, [defaultLang])
    React.useMemo(() => {
        if(window.languageList && window.languageList.length) {
            let tmp = []

            window.languageList.map(item => {
                tmp.push([ item.code, item.name ])
            })
            setList(tmp)
        }
    }, [])

    return (
        <div className="modal setlanguage">
            <div className="block">
                <h1 className="title">Have we chosen the right language?</h1>
                <Select _type={language[0]} _list={list} onChange={elem => {
                    setLanguage(elem)
                }} />
                <span className="desc">
                    Later you will be able to change the language in the <Link className="link" target="_blank" to="/settings">settings</Link>
                </span>
            </div>
            <div className="action">
                <button className="btn transparent" onClick={() => onChange()}>Yes</button>
                <button className="btn" onClick={() => onChange(language)}>No, change</button>
            </div>
        </div>
    )
}