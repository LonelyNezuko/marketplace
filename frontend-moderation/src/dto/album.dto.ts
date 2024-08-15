import { StorageDTO, StorageFilesAccess } from "./storage.dto";
import UserDTO from "./user.dto";

export default interface AlbumDTO {
    albumKey: string;
    albumLength: number;
    albumName: string;
    albumCreateAt: Date
    owner: UserDTO;
    access: StorageFilesAccess;
    files: StorageDTO[];
}