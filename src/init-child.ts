import IPOSMessaging from './messaging.js'
import IPOS from './main.js'

export default function initChild(this: IPOS) {
    let resolve: Function
    const promise = new Promise(res => resolve = res)

    this.messaging = new IPOSMessaging(process)
    this.messaging?.listenForType('sync', message => {
        if (!message.fields) return
        Object.entries(
            IPOS.deserialize(JSON.parse(message.fields))
        )
            .map(([key, value]: [string, any]) => {
                this.create(key, value.constructor())
                if (Array.isArray(value)) {
                    this.get(key)?.push(...value)
                }
            })
        resolve()
    })
    // register with parent process
    this.messaging.send('register')

    return promise
}
