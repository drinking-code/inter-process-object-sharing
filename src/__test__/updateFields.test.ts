import _ from 'lodash'

import IPOS from '../main'

import createConnectedInstances from './createConnectedInstances'
import {exampleChanges, examples} from './testData'

type ValueOf<T> = T[keyof T]

function createFieldsTest(
    initWith: (
        methods: ValueOf<typeof exampleChanges>,
        setValue: (ipos_for_setting: IPOS) => void,
        probeValue: (ipos_for_setting: IPOS, ipos_for_probing: IPOS) => void
    ) => Promise<void>,
    createLabel: (key: string) => string
) {
    for (const exampleKey in exampleChanges) {
        if (!examples.hasOwnProperty(exampleKey)) continue
        it(createLabel(exampleKey), async () => {
            const value: ValueOf<typeof examples> = examples[exampleKey as keyof typeof examples]
            const methods: ValueOf<typeof exampleChanges> = exampleChanges[exampleKey as keyof typeof exampleChanges]
            await initWith(
                methods,
                (ipos_for_setting) => {
                    ipos_for_setting.create('myField', value)
                },
                (ipos_for_setting, ipos_for_probing) => {
                    // lodash equal to compare maps and sets
                    expect(_.isEqual(ipos_for_setting.myField, ipos_for_probing.myField)).toEqual(true)
                }
            )
        })
    }
}

describe('Update fields in the main process', () =>
    createFieldsTest(
        async (
            methods: ValueOf<typeof exampleChanges>,
            setValue: (ipos_for_setting: IPOS) => void,
            probeValue: (ipos_for_setting: IPOS, ipos_for_probing: IPOS) => void
        ) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()
            setValue(main_ipos)

            for (const changeValue of methods) {
                changeValue(main_ipos.myField as any)
                probeValue(main_ipos, sub_ipos)
            }

            sub_process.destroy()
        },
        (key) => `Update ${key}`
    )
)

describe('Update fields in the subprocess', () =>
    createFieldsTest(
        async (
            methods: ValueOf<typeof exampleChanges>,
            setValue: (ipos_for_setting: IPOS) => void,
            probeValue: (ipos_for_setting: IPOS, ipos_for_probing: IPOS) => void
        ) => {
            const {main_ipos, sub_ipos, sub_process} = await createConnectedInstances()
            setValue(sub_ipos)

            for (const changeValue of methods) {
                changeValue(sub_ipos.myField as any)
                probeValue(sub_ipos, main_ipos)
            }

            sub_process.destroy()
        },
        (key) => `Update ${key}`
    )
)
