import _ from 'lodash'
import IPOS from '../main'
import {examples} from './testData'

export default function createFieldsTest(
    initWith: (setValue: (main_ipos: IPOS) => void, probeValue: (sub_ipos: IPOS) => void) => void,
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
                (main_ipos) => {
                    main_ipos.create('myField', value)
                },
                (sub_ipos) => {
                    // lodash equal to compare maps and sets
                    expect(_.isEqualWith(sub_ipos.myField, value, customizer)).toEqual(true)
                    expect(_.isEqualWith(sub_ipos.get('myField'), value, customizer)).toEqual(true)
                }
            )
        })
    }
}
