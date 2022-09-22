import createConnectedInstances from './createConnectedInstances'

describe('Deleting fields', () => {
    it('...in the main process', async () => {
        const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

        main_ipos.create('myField', 'myValue')
        expect(sub_ipos.myField).toEqual('myValue')
        main_ipos.delete('myField')
        expect(sub_ipos.myField).not.toBeDefined()

        sub_process.destroy()
    })

    it('...in the sub process', async () => {
        const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

        main_ipos.create('myField', 'myValue')
        expect(main_ipos.myField).toEqual('myValue')
        sub_ipos.delete('myField')
        expect(main_ipos.myField).not.toBeDefined()

        sub_process.destroy()
    })
})
