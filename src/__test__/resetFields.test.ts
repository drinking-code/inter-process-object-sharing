import IPOS from '../main'

import createFieldsTest from './runCreateFieldsTest'
import createConnectedInstances from './createConnectedInstances'

describe('Updating fields between processes (transferring newly created fields)', () =>
    createFieldsTest(
        async (setValue: (main_ipos: IPOS, reset: boolean) => void, probeValue: (sub_ipos: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            main_ipos.create('myField', 'myValue')
            setValue(main_ipos, true)

            probeValue(sub_ipos)

            sub_process.destroy()
        },
        (key) => `Reset ${key}`
    )
)
