import UserDTO from "@dto/user.dto";
import { SettingsData } from "..";

export interface RouteAccountSettings_modalProps {
    onClose?(): void,

    account: UserDTO,
    setAccount?: React.Dispatch<React.SetStateAction<UserDTO>>,

    data?: SettingsData,
    setData?: React.Dispatch<React.SetStateAction<SettingsData>>,

    setBeforeChangesData?: React.Dispatch<React.SetStateAction<SettingsData>>
}