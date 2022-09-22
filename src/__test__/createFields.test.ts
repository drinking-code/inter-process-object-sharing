import IPOS from '../main'

import createFieldsTest from './runCreateFieldsTest'
import createConnectedInstances from './createConnectedInstances'

describe('Creating fields in the main process', () =>
    createFieldsTest(
        async (setValue: (ipos_for_setting: IPOS) => void, probeValue: (ipos_for_probing: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            // @ts-ignore Variable 'main_ipos' is used before being assigned.
            setValue(main_ipos)

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

describe('Creating fields in the subprocess', () =>
    createFieldsTest(
        async (setValue: (ipos_for_setting: IPOS) => void, probeValue: (ipos_for_probing: IPOS) => void) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()

            // @ts-ignore Variable 'main_ipos' is used before being assigned.
            setValue(sub_ipos)

            // @ts-ignore Variable 'sub_ipos' is used before being assigned.
            probeValue(main_ipos)

            sub_process.destroy()
        },
        (key) =>
            ['a', 'e', 'i', 'o', 'u'].some(vowel => key.startsWith(vowel))
                ? `Create an ${key}`
                : `Create a ${key}`
    )
)
