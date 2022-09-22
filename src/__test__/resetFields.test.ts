import IPOS from '../main'

import createFieldsTest from './runCreateFieldsTest'
import createConnectedInstances from './createConnectedInstances'

describe('Resetting fields in the main process', () =>
    createFieldsTest(
        async (setValue: (ipos_for_setting: IPOS, reset: boolean) => void, probeValue: (ipos_for_probing: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            main_ipos.create('myField', 'myValue')
            setValue(main_ipos, true)

            probeValue(sub_ipos)

            sub_process.destroy()
        },
        (key) => `Reset ${key}`
    )
)

describe('Resetting fields in the sub process', () =>
    createFieldsTest(
        async (setValue: (ipos_for_setting: IPOS, reset: boolean) => void, probeValue: (ipos_for_probing: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            main_ipos.create('myField', 'myValue')
            setValue(sub_ipos, true)

            probeValue(main_ipos)

            sub_process.destroy()
        },
        (key) => `Reset ${key}`
    )
)
