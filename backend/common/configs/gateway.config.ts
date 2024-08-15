const NODEENV: string = process.env.NODE_ENV

const CONFIG_GATEWAY = {
    port: (!NODEENV || NODEENV === 'development') ? 7030 : 12030,
    cors: (!NODEENV || NODEENV === 'development') ? '*' : ["https://moder.iboot.uk", "https://iboot.uk", "https://admin.iboot.uk"],
}

export default CONFIG_GATEWAY