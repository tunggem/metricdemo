const { initTracer } = require('jaeger-client');
const opentracing = require('opentracing');
const persistor = require('./persistor');
const { subscribe, sendEvent, EMAIL_SINGLE_ASYNC_CALL, IDENTITY_SINGLE_PERSISTOR_ASYNC_CALL } = require('./subscription');

var config = {
  serviceName: 'identity-service',
  reporter: {
    collectorEndpoint: "http://localhost:14268/api/traces",
    'logSpans': true,
  },
  'sampler': {
    'type': 'probabilistic',
    'param': 1.0
  }
};
var options = {
  tags: {
    'identity-service': '0.1.0',
  },
  logger: {
    info: function logInfo(msg) {
      console.log('INFO  ', msg);
    },
    error: function logError(msg) {
      console.log('ERROR ', msg);
    }
  }
};

const identityTracer = initTracer(config, options);

const getMail = (event) => {
  const carrier = event.tracingData;
  const parentSpanContext = identityTracer.extract(opentracing.FORMAT_TEXT_MAP, carrier);
  const span = identityTracer.startSpan('async_message_call', { childOf: parentSpanContext })
  span.log({ 'event': 'ASYNC_MESSAGE_CALL' });
  // span.log({ 'event': 'IDENTITY_HANDLE_MAIL_ASYNC' });
  span.log({ 'data': event.data });
  // span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'persistor');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'identity');
  // persistor.persistorHandler(body, span.context());
  span.finish();
}

const multipleAsyncHandler = (event) => {
  const span = identityTracer.startSpan('multiple_async', { childOf: spanContext })
  span.log({ 'event': 'IDENTITY_HANDLE_MULTIPLE_ASYNC' });
  span.log({ 'data': body });
  span.finish();
}

subscribe('identity', (event) => {
  if (!event) return;

  switch (event.typeName) {
    case EMAIL_SINGLE_ASYNC_CALL:{
      getMail(event)
    }break;
    default:{
      console.log('not found handler',event)
    }
  }
})


