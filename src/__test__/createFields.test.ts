import IPOS from '../main'

import createFieldsTest from './runCreateFieldsTest'
import createConnectedInstances from './createConnectedInstances'

describe('Updating fields between processes (transferring newly created fields)', () =>
    createFieldsTest(
        async (setValue: (main_ipos: IPOS) => void, probeValue: (sub_ipos: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            // @ts-ignore Variable 'main_ipos' is used before being assigned.
            setValue(main_ipos)

            // make sure value is transmitted
            await new Promise(res => setTimeout(res, 1))

            // @ts-ignore Variable 'sub_ipos' is used before being assigned.
            probeValue(sub_ipos)

            sub_process.destroy()
        },
        (key) =>
            ['a', 'e', 'i', 'o', 'u'].some(vowel => key.startsWith(vowel))
                ? `Create an ${key}`
                : `Create a ${key}`
    )
)
