import React from 'react'
import Resizer from "react-image-file-resizer";

import { API } from '@modules/API'
import { notify } from '@modules/Notify'
import { Language } from '@modules/Language';

import { Modal } from '@components/modals'
import { Alert } from '@components/alert'
import UploadDropFile from '@components/uploadDropFile';
import { CircleLoader } from '@components/circleLoader/circleLoader';
import { Avatar } from '@components/avatar/avatar';

import CONFIG from '@config'

import { FaRegSmileBeam } from "react-icons/fa";
import UserDTO from '@dto/user.dto';
import { SettingsData } from '..';
import { RouteAccountSettings_modalProps } from './props';

export default function RouteAccountSettings_modalChangeAvatar({
    onClose,

    account,
    setAccount,

    data,
    setData,

    setBeforeChangesData
}: RouteAccountSettings_modalProps) {
    const [ changeAvatarImage, setChangeAvatarImage ] = React.useState(null)
    const [ changeAvatarLoader, setChangeAvatarLoader ] = React.useState(false)
    const [ changeAvatarLoaderBtn, setChangeAvatarLoaderBtn ] = React.useState(false)
    const [ changeAvatarImagePreview, setChangeAvatarImagePreview ] = React.useState([
        '', // full
        '', // 120
        '', // 70
        '' // 50
    ])

    function avatarLoad() {
        if(changeAvatarLoader || !changeAvatarImage || changeAvatarLoaderBtn)return

        setChangeAvatarLoaderBtn(true)
        let formData = new FormData()
        
        formData.append('files[]', changeAvatarImage, changeAvatarImage.name)
        formData.append('access', 'default')

        API({
            url: '/defaultapi/service/storage/upload',
            type: 'post',
            data: formData,
            contentType: false,
            processData: false
        }).done(result => {
            if(result.statusCode === 200) {
                API({
                    url: '/defaultapi/user/settings/changeavatar',
                    type: 'put',
                    data: {
                        image: result.message[0].images[0].link.replace('?size=1920', ''),
                        size: 100,
                        position: { x: 0, y: 0 }
                    }
                }).done(result => {
                    if(result.statusCode === 200) {
                        onClose()
                        Alert("Фото профиля было загружено и установлено", "success")

                        setAccount(old => {
                            return { ...old, avatar: result.message }
                        })
                        setData(old => {
                            return { ...old, avatar: result.message }
                        })
                        setBeforeChangesData(old => {
                            return { ...old, avatar: result.message }
                        })
                    }
                    else notify("/user/settings/changeavatar: " + result.message, { debug: true })
                })
            }
            else notify("/service/storage/upload: " + result.message, { debug: true })
        })
    }

    function avatarUpload(event) {
        const file = event[0]

        if(file.size >= CONFIG.profileAvatarMaxSizeMB * CONFIG.mbtobyte)return Alert("Размер файла превышает допустимый.\nМаксимальный размер: 4 МБ", "error")
        if(file.type.indexOf("image/") === -1)return Alert("Загружать можно только image файлы", "error")

        var reader = new FileReader()
        reader.onload = async(e) => {
            setChangeAvatarLoader(true)
            let image: any = new Image()

            image.src = e.target.result
            await image.decode()

            const width = image.width
            const height = image.height

            if(width > 1920) {
                setChangeAvatarLoader(false)
                return Alert("Максимальная ширина изображения должна быть не больше 1920px", "error")
            }

            const resizeFile = (index, file, size) =>
                new Promise((resolve) => {
                    Resizer.imageFileResizer(
                        file,
                        size,
                        size,
                        file.type.replace('image/', ''),
                        100,
                        0,
                        (newfile: Blob) => {
                            setChangeAvatarImagePreview(old => {
                                old[index] = URL.createObjectURL(newfile)

                                if(index === 3) {
                                    setChangeAvatarImage(file)
                                    setChangeAvatarLoader(false)
                                }
                                return [...old]
                            })
                        },
                        "file"
                    );
                }
            );

            setChangeAvatarImagePreview([ URL.createObjectURL(file), '', '', '' ])

            resizeFile(1, file, 120)
            resizeFile(2, file, 70)
            resizeFile(3, file, 50)
        }

        setChangeAvatarLoader(true)
        reader.readAsDataURL(file)
    }
    function Render() {
        if(!changeAvatarImage)return (<UploadDropFile onLoad={avatarUpload} />)
        if(changeAvatarLoader)return (
            <div style={{width: "100%", height: "100%", display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0'}}>
                <CircleLoader color={'var(--tm-color)'} type={"big"} />
            </div>
        )

        return (
            <div className="changeAvatarUploaded">
                <div className="image">
                    <Avatar image={changeAvatarImagePreview[0]} size={account.avatar.size} position={account.avatar.position} />
                </div>
                <div className="preview">
                    <Avatar circle={true} image={changeAvatarImagePreview[1]} size={account.avatar.size} position={account.avatar.position} type={"big"} />
                    <Avatar circle={true} image={changeAvatarImagePreview[2]} size={account.avatar.size} position={account.avatar.position} type={"medium"} />
                    <Avatar circle={true} image={changeAvatarImagePreview[3]} size={account.avatar.size} position={account.avatar.position} />
                </div>
            </div>
        )
    }

    return (
        <Modal id={"accountSettingsChangeAvatarModal"} toggle={true} title={"Фото профиля"} desciption={"Выберите фото профиля, идеально описывающее Вас"}
            phoneHideBtn={true}
            phoneVersion={true}
            icon={(<FaRegSmileBeam />)}
            body={(<Render />)}

            buttons={(changeAvatarLoader || !changeAvatarImage) ? [] : changeAvatarLoaderBtn ? ([ (<>&nbsp;</>), <CircleLoader /> ]) : [ Language("BACK"), Language("CHANGE_AVATAR") ]}
            buttonsBlock={!changeAvatarLoaderBtn ? false : true}

            onClose={isBtn => {
                if(!isBtn || (changeAvatarLoader || !changeAvatarImage)) {
                    if(onClose) onClose()
                    return
                }

                setChangeAvatarImage(null)
            }}
            onClick={() => avatarLoad()}
        />
    )
}