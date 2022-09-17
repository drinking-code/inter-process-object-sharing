import IPOS from '../lib/main.js'

const sharedObject = await IPOS.new()
console.log('sharedObject.exampleArray', sharedObject.exampleArray)
// console.log(sharedObject.exampleArray[0], /*...sharedObject.exampleObject.entries()*/)
