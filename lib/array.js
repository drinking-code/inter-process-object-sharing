export default class InterceptedArray extends Array {
    callback;
    // intercepts only methods that change the object
    constructor(callback) {
        super();
        this.callback = callback;
    }
    copyWithin(target, start, end) {
        this.callback(this, 'copyWithin', target, start, end);
        return super.copyWithin(target, start, end);
    }
    fill(value, start, end) {
        this.callback(this, 'fill', value, start, end);
        return super.fill(value, start, end);
    }
    pop() {
        this.callback(this, 'pop');
        return super.pop();
    }
    push(...items) {
        this.callback(this, 'push', ...items);
        return super.push(...items);
    }
    reverse() {
        this.callback(this, 'reverse');
        return super.reverse();
    }
    shift() {
        this.callback(this, 'shift');
        return super.shift();
    }
    sort(compareFn) {
        this.callback(this, 'sort', compareFn);
        return super.sort(compareFn);
    }
    splice(start, deleteCount) {
        this.callback(this, 'splice', start, deleteCount);
        return super.splice(start, deleteCount);
    }
    unshift(...items) {
        this.callback(this, 'unshift', ...items);
        return super.unshift(...items);
    }
}
