import child_process from 'child_process'
import IPOS from '../lib/main.js'

const sharedObject = IPOS.new()
sharedObject.create('exampleArray', [])
sharedObject.exampleArray.push('hello')

const subProcess = child_process.spawn('node', ['sub-process.js'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
})

await sharedObject.addProcess(subProcess)
sharedObject.create('exampleObject', {})
sharedObject.exampleObject.from = 'the other side'

console.log(sharedObject.exampleArray, sharedObject.exampleObject)
