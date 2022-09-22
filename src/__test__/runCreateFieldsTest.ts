import _ from 'lodash'
import IPOS from '../main'
import {examples} from './testData'

export default function createFieldsTest(
    initWith: (setValue: (ipos_for_setting: IPOS, reset?: boolean) => void, probeValue: (ipos_for_probing: IPOS) => void) => void,
    createLabel: (key: string) => string
) {
    function customizer(a: any, b: any) {
        // compare function contents
        if ([typeof a, typeof b].every(a => a === 'function')) {
            return a.toString() === b.toString();
        }
    }

    for (const exampleKey in examples) {
        if (!examples.hasOwnProperty(exampleKey)) continue
        it(createLabel(exampleKey), async () => {
            const value: unknown = examples[exampleKey]
            await initWith(
                (ipos_for_setting, reset = false) => {
                    if (!reset) {
                        ipos_for_setting.create('myField', value)
                    } else {
                        ipos_for_setting.myField = value
                    }
                },
                (ipos_for_probing) => {
                    // lodash equal to compare maps and sets
                    expect(_.isEqualWith(ipos_for_probing.myField, value, customizer)).toEqual(true)
                    expect(_.isEqualWith(ipos_for_probing.get('myField'), value, customizer)).toEqual(true)
                }
            )
        })
    }
}
