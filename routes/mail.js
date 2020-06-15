var express = require('express');
var router = express.Router();
const fs = require('fs');
const {initTracer} = require('jaeger-client');
const opentracing = require('opentracing');
const identityService = require('../services/identity');
const persistorService = require('../services/persistor');

var config = {
  serviceName: 'mail-service',
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
    'mail-service': '0.1.0',
  },
  logger: {
    info: function logInfo(msg) {
      console.log('INFO  ', msg);
    },
    error: function logError(msg) {
      console.log('ERROR ', msg);
    }
  }
  // metrics: metrics,
  // logger: logger,
};

const mailTracer = initTracer(config, options);
console.log('initialized mailTracer');
/* GET users listing. */
router.get('/', async function(req, res, next) {
  const span = mailTracer.startSpan('http_request');
  span.log({'event':'GET mails'});
  span.finish();
  res.status(200).json({success: true});
});

router.post('/single', async (req, res, next) => {
  const span = mailTracer.startSpan('single_message_call');
  const {body } = req;
  span.log({'event':'SINGLE_MESSAGE_CALL'});
  span.log({'data': body});
  span.finish();
  res.status(201).json({success: true});
})

router.post('/async', async (req, res, next) => {
  const span = mailTracer.startSpan('async_message_call');
  const {body } = req;
  span.log({'event':'ASYNC_MESSAGE_CALL'});
  span.log({'data': body});
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'mail');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'identity');
  identityService.getMail(body, span.context());
  span.finish();
  res.status(201).json({success: true});
})

router.post('/multiple_async', async (req, res, next) => {
  const span = mailTracer.startSpan('multiple_async');
  const {body } = req;
  span.log({'event':'MULTIPLE_ASYNC_MESSAGE'});
  span.log({'data': body});
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'mail');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'identity');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'persistor');
  identityService.multipleAsyncHandler(body, span.context());
  persistorService.multipleAsyncHandler(body, span.context());
  span.finish();
  res.status(201).json({success: true});
})

module.exports = router;
