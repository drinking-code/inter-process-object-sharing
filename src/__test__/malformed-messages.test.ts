import createConnectedInstances from './create-connected-instances'
import {iposMessagingType} from '../messaging'

async function testMalformedMessageNotToThrow(type: iposMessagingType, data?: {}) {
    const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()
    // @ts-ignore
    expect(() => main_ipos.sendToAll(type, data)).not.toThrow()
}

describe('Sending malformed messages', () => {
    it('Set message without "key"/"value"', async () => {
        await testMalformedMessageNotToThrow('set', {})
    })

    it('Update message without "do"/"on"', async () => {
        await testMalformedMessageNotToThrow('update', {})
    })

    it('Update message without "with"', async () => {
        await testMalformedMessageNotToThrow('update', {
            do: '$$iposDefine',
            on: 'myKey',
        })
    })

    it('Delete message without "key"', async () => {
        await testMalformedMessageNotToThrow('delete', {})
    })

    it('Delete message without "key"', async () => {
        await testMalformedMessageNotToThrow('delete', {})
    })

    it('Sync message without "fields"', async () => {
        await testMalformedMessageNotToThrow('sync', {})
    })
})
