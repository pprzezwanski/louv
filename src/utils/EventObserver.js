export default class EventObserver {
  constructor() {
    // this.sender = sender
    this.listeners = [];
  }

  attach(method) {
    this.listeners.push(method);
    return this;
  }

  clean() {
    this.listeners.length = 0;
    return this;
  }

  notify(args) {
    this.listeners.forEach(
      (c, i) => this.listeners[i](args)
    );

    return this;
  }
}
