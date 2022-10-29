import IPOS from './main.js'

export default function initChild(this: IPOS, timeout: number) {
    let resolve: Function
    const promise = new Promise((res, reject) => {
        resolve = res
        setTimeout(reject, timeout)
    })

    // @ts-ignore Object is possibly 'undefined'
    this.messaging.listenForType('sync', message => {
        if (!message.fields || !(message.fields instanceof Map)) return
        Array.from(message.fields.entries())
            .map(([key, value]: [string, any]) => {
                this.createStealthy(key, value)
            })
        this.messaging?.send('sync_ok')
        resolve()
    })
    // register with parent process
    // @ts-ignore Object is possibly 'undefined'
    this.messaging.send('register')
    this.mountListeners(
        // @ts-ignore Object is possibly 'undefined'
        this.messaging
    )

    return promise
}
