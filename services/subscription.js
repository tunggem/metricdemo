const EventEmitter = require('events');

const eventEmitter = new EventEmitter();

function sendEvent(event) {
  if (!event.targets) return;

  if (!event.targets.length) return;

  const { targets, data } = event;

  targets.forEach(target => {
    eventEmitter.emit(target, event);
  })
}

function subscribe(channel, cb) {
  eventEmitter.on(channel, cb);
}

module.exports = {
  sendEvent,
  subscribe,
  EMAIL_SINGLE_ASYNC_CALL: 'EMAIL_SINGLE_ASYNC_CALL',
  IDENTITY_SINGLE_PERSISTOR_ASYNC_CALL: 'IDENTITY_SINGLE_PERSISTOR_ASYNC_CALL'
};