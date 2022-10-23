export function withoutProcessSend(callback: () => void) {
    const processSend = process.send
    process.send = undefined
    callback()
    process.send = processSend
}
