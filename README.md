# Inter Process Object Sharing [IPOS]

[![](https://img.shields.io/npm/v/ipos?style=flat-square)](https://npmjs.com/ipos)
[![](https://img.shields.io/coveralls/github/drinking-code/inter-process-object-sharing?style=flat-square)](https://coveralls.io/github/drinking-code/inter-process-object-sharing)
![](https://img.shields.io/github/workflow/status/drinking-code/inter-process-object-sharing/Test?style=flat-square)

[//]: # (![]&#40;https://img.shields.io/npms-io/quality-score/ipos?style=flat-square&#41;)

_Share objects across different Node.js processes. Write and read on both sides._  
This package manages objects via IPC for you. When you create an object, it creates an equivalent on connected
processes. When you update that object, it updates the equivalent accordingly. And if you delete the object, it will
also delete the equivalent. This works both ways, so if you change the equivalent object in a subprocess, the original
will be changes as well.

## Install

```shell
npm i ipos
```

## Usage

In the main process:

```javascript
import child_process from 'child_process'
import IPOS from 'ipos'

// create a shared object instance
const sharedObject = IPOS.new()
// spawn a subprocess
// the ipc channel (4th stdio argument) is important
const subProcess = child_process.spawn('node', ['sub-process.js'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
})
// register the subprocess with IPOS
// await: to wait for the connection to be established
await sharedObject.addProcess(subProcess)
```

In the subprocess:

```javascript
import IPOS from 'ipos'

// await: to wait for the connection to be established (await only in subprocess)
const sharedObject = await IPOS.new()
```

See [`example/main-process.js`](https://github.com/drinking-code/inter-process-object-sharing/blob/main/example/main-process.js)
and [`example/sub-process.js`](https://github.com/drinking-code/inter-process-object-sharing/blob/main/example/sub-process.js)
.

### A note on class instances

To synchronise class instances, you first have to register the class with ipos _on each process_ (on which the class
instance does not yet exist) before the synchronisation happens. That means if you want to connect two IPOS instances,
and the instance on the main process has a class instance somewhere inside a field, this class type must be registered
on the subprocess, before calling `IPOS.new()`. For IPOS to be able to transmit the class instance it has to have
methods to serialise (turn the class instance into either a string, a number, an object, an array, a map, or a set) and
deserialize (turn the serialised value back into a class instance). IPOS will look for `.serialize()`, or `.stringify()`
for serialisation and `.from()` for de-serialisation, but you can specify custom methods / functions. Here is an
example:

```javascript
// example-class.js

export class Example {
    data;

    constructor(data) {
        this.data = data
    }

    serialize() {
        return this.data
    }

    static from(data) {
        return new Example(data)
    }
}
```

```javascript
// main-process.js

import IPOS from 'ipos'

const exampleInstance = new Example('myValue')
const ipos = IPOS.new()
ipos.create('myClassInstance', exampleInstance)
const subProcess = child_process.spawn('node', ['sub-process.js'], {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
})
await sharedObject.addProcess(subProcess)
```

```javascript
// sub-process.js

import IPOS from 'ipos'
import {Example} from './example-class.js'

const ipos = IPOS.registerClass(Example)
const ipos = await IPOS.new()
```

### `IPOS()`

The main class. Don't use the `new` keyword (when creating an instance in a subprocess). Instead, use the static
[`IPOS.new()`](#static-iposnewconfig--synctimeout-number--ipos--promiseipos) method to create an instance.

#### `static IPOS.new(config?: { syncTimeout: number }): IPOS | Promise<IPOS>`

Creates a new instance. Multiple instances are not yet supported, so only create one instance per process. If it can
synchronise with a parent process (i.e. `process.send()` exists), it will return a Promise which resolves after the
synchronisation happened. Sometimes `IPOS.new()` is called in a subprocess but the parent process does not have an IPOS
instance or has an IPOS instance but does not connect to the subprocess. Because of this, the promise returned
by `IPOS.new()` resolves after 100ms without receiving a sync signal.

**Parameters:**

- `config?: {}` An optional config object with:
  - `syncTimeout: number` Time in milliseconds after which `IPOS.new()` auto-resolves

**Returns:**

- `<IPOS>` instance, if called in a normal process
- `Promise<IPOS>`, if called in a subprocess.  
  Use await to wait for the connection to the main process to be established.

#### `ipos.addProcess(process: ChildProcess): Promise<void>`

Connect a subprocess to the IPOS instance. The subprocess must also call
[`IPOS.new()`](#static-iposnewconfig--synctimeout-number--ipos--promiseipos) for the two processes' IPOS to connect.

**Parameters:**

- `process: ChildProcess` The object of a subprocess IPOS should connect with. What gets returned
  by `child_process.exec()`, `child_process.execFile()`, `child_process.fork()`, or `child_process.spawn()`

**Returns:** `Promise<void>`. Use await to wait for the connection to the subprocess to be established.

#### `ipos.removeProcess(process: ChildProcess): boolean`

Disconnect a subprocess to the IPOS instance. Closed subprocess automatically get disconnected.

**Parameters:**

- `process: ChildProcess` The object of a subprocess IPOS should disconnect from. What gets returned
  by `child_process.exec()`, `child_process.execFile()`, `child_process.fork()`, or `child_process.spawn()`

**Returns:** `boolean`. `true` if a process was connected and has been disconnected, or `false` if the process was not
connected.

#### `ipos.create(key: string, value: any)`

Create a field on the IPOS instance. This value can later be accessed or updated (See
[`ipos.get()`](#iposgetkey-string-any)). After creating a field, you can access and update it (even change the type)
with `ipos[key: string] = value`. See:

```javascript
sharedObject.create('myValue', 23)
sharedObject.myValue = 'foo'
console.log(sharedObject.myValue) // -> 'foo'
```

`ipos.create()` can be called multiple times with the same key. Each time the old value will be overwritten.

**Parameters:**

- `key: string` A unique key.
- `value: any` The value to be stored.

#### `ipos.get(key: string): any`

Get an already created field from the IPOS instance. You can also use `ipos[key: string]` to access the value. If you
use a method on the value that changes the value, this change will also be reflected in the connected IPOS instances.
See:

```javascript
sharedObject.create('myArray', [])
sharedObject.myArray.push('myString')
console.log(sharedObject.get('myArray')) // -> ['myString']
console.log(sharedObject.myArray) // -> ['myString']
```

And in a connected process, after `'myString'` was pushed:

```javascript
console.log(sharedObject.myArray) // -> ['myString']
```

**Parameters:**

- `key: string` A unique key of an already created field.

**Returns:** `any`. The stored value.

#### `ipos.delete(key: string): boolean`

Deletes the field with the specified key.

**Parameters:**

- `key: string` A unique key of an already created field.

**Returns:** `boolean`. `true` if a field existed and has been removed, or `false` if the element does not exist.

## Testing

### Glossary of terms

- **"Synchronise"** a field: _Creating a main instance, then adding a field before connecting to a child instance._ The
  field will be transmitted along with any other fields that may have been created during the connection process
  (synchronisation).
- **"Create"** a field: _Creating a main instance, and connecting it to a child instance, then adding a field._ The
  field will be transmitted on its own with a "set" message.
- **"Reset"** a field: _Setting a field with a new value after it has been added and transferred._ The field will be
  transmitted on its own with a "set" message.
- **"Update"** a field: _Changing the value of a field after it has been added and transferred._ This is only possible
  on fields with a value that is not immutable (i.e. objects, arrays, maps, sets, and class instances). The change and
  not the complete value will be transferred with an "update" message.
- **"Delete"** a field: _Remove a field._ The deletion will be communicated with a "delete" message.
