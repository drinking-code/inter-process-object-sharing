export default function initChild() {
    let resolve;
    const promise = new Promise(res => resolve = res);
    this.messaging?.listenForType('sync', message => {
        if (!message.fields)
            return;
        Object.entries(message.fields)
            .map(([key, value]) => {
            this.createStealthy(key, value);
        });
        this.messaging?.send('sync_ok');
        resolve();
    });
    // register with parent process
    this.messaging?.send('register');
    if (this.messaging)
        this.mountListeners(this.messaging);
    return promise;
}
