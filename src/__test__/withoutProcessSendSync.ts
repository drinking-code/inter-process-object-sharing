export function withoutProcessSendSync(callback: () => void) {
    const processSend = process.send
    process.send = undefined
    callback()
    process.send = processSend
}

export async function withoutProcessSend(callback: () => Promise<any>) {
    const processSend = process.send
    process.send = undefined
    await callback()
    process.send = processSend
}
