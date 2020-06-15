const {initTracer} = require('jaeger-client');
const opentracing = require('opentracing');
const persistor = require('./persistor');

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

console.log('initialized identityTracer');

module.exports.getMail = (body, spanContext) => {
  const span = identityTracer.startSpan('async_message_call', {childOf: spanContext})
  span.log({'event':'ASYNC_MESSAGE_CALL'});
  span.log({'event':'IDENTITY_HANDLE_MAIL_ASYNC'});
  span.log({'data': body});
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'persistor');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'identity');
  persistor.persistorHandler(body, span.context());
  span.finish();
}

module.exports.multipleAsyncHandler = (body, spanContext) => {
  const span = identityTracer.startSpan('multiple_async', {childOf: spanContext})
  span.log({'event':'IDENTITY_HANDLE_MULTIPLE_ASYNC'});
  span.log({'data': body});
  span.finish();
}

