class Store {
  constructor(state) {
    this.state = state;
    this.listeners = {};
  }
  on(event, cb) {
    (this.listeners[event] ??= []).push(cb);
  }
  emit(event, payload) {
    (this.listeners[event] || []).forEach(cb => cb(payload));
   // console.log(event);
  }
  update(mutator, events = []) {
    mutator(this.state);
    events.forEach(e => {
      if (Array.isArray(e)) {
        const [name, payload] = e;
        this.emit(name, payload);
      } else {
        this.emit(e, this.state);
      }
    });
  }
}


import { G } from './game.js';
export const store = new Store(G);


// RUNNING LIST OF EVENTS
/*
signRound:changed
lineup:bench:changed
lineup:bullpen:changed
lineup:signing
opponents:changed
schedule:changed
season:changed
spring:complete
event:complete





*/