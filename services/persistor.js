const {initTracer} = require('jaeger-client');
const opentracing = require('opentracing');

var config = {
  serviceName: 'persistor-service',
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
    'persistor-service': '0.1.0',
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

const persistorTrace = initTracer(config, options);

console.log('initialized persistorTrace');

module.exports.persistorHandler = (body, spanContext) => {
  const span = persistorTrace.startSpan('async_message_call', {childOf: spanContext})
  span.log({'event':'PERSISTOR_IDENTITY_HANDLER'});
  span.log({'data': body});
  span.finish();
}

module.exports.multipleAsyncHandler = (body, spanContext) => {
  const span = persistorTrace.startSpan('multiple_async', {childOf: spanContext})
  span.log({'data': body});
  span.finish();
}

