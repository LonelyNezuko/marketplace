const CONFIG_STORAGE = {
    link: process.env.NODE_ENV === 'development' ? "http://localhost:7000/defaultapi/service/storage/" : "https://api.iboot.uk/defaultapi/service/storage/",

    albumKeyLength: 64,
    fileKeyLength: 64,
    
    maxFileSize: 31457280,
    maxFilesAlbumLength: 50,

    mimeTypes: [ 'image/gif', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/zip', 'application/rar', 'application/tar' ],
    imageWidthList: [ 1920, 1600, 1366, 1024, 720, 360, 180, 90, 45 ]
}

export default CONFIG_STORAGE