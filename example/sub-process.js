import IPOS from '../lib/main.js'

const sharedObject = await IPOS.new()
// wait for the main process to set the values for "exampleObject"
setTimeout(() =>
        console.log(sharedObject.exampleArray[0], ...Object.entries(sharedObject.exampleObject)[0]),
    10)
