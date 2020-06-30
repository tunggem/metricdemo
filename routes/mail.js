var express = require('express');
var router = express.Router();
const fs = require('fs');
const { initTracer, TextMapCodec } = require('jaeger-client');
const opentracing = require('opentracing');
const identityService = require('../services/identity');
const persistorService = require('../services/persistor');
const eventBuilder = require('../services/eventBuilder');
const { sendEvent, EMAIL_SINGLE_ASYNC_CALL } = require('../services/subscription');


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
};

const mailTracer = initTracer(config, options);
const codec = new TextMapCodec({ urlEncoding: true });
// mailTracer.registerInjector(opentracing.FORMAT_TEXT_MAP, codec);
// mailTracer.registerExtractor(opentracing.FORMAT_TEXT_MAP, codec);


console.log('initialized mailTracer');
/* GET users listing. */
router.get('/', async function (req, res, next) {
  const span = mailTracer.startSpan('http_request');
  span.log({ 'event': 'GET mails' });
  span.finish();
  res.status(200).json({ success: true });
});

router.get('/single', async (req, res, next) => {
  const span = mailTracer.startSpan('single_message_call');
  const body = { request: "single request" };
  span.log({ 'event': 'SINGLE_MESSAGE_CALL' });
  span.log({ 'data': body });
  span.finish();
  res.status(200).json({ success: true });
})

router.get('/async', async (req, res, next) => {
  const span = mailTracer.startSpan('async_message_call');
  const body = { request: 'async request' };
  span.log({ 'event': 'ASYNC_MESSAGE_CALL' });
  span.log({ 'data': body });
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'mail');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'identity');
  const tracingData = {};
  mailTracer.inject(span.context(), opentracing.FORMAT_TEXT_MAP, tracingData)
  const event = eventBuilder({
    data: body,
    type: EMAIL_SINGLE_ASYNC_CALL,
    source: 'mail',
    targets: ['identity'],
    tracingData
  });

  sendEvent(event);
  // identityService.getMail(body, span.context());
  span.finish();
  res.status(200).json({ success: true });
})

router.get('/multiple_async', async (req, res, next) => {
  const span = mailTracer.startSpan('multiple_async');
  const body = { request: 'multiple_async request' };
  span.log({ 'event': 'MULTIPLE_ASYNC_MESSAGE' });
  span.log({ 'data': body });
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_PRODUCER, 'mail');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'identity');
  span.setTag(opentracing.Tags.SPAN_KIND_MESSAGING_CONSUMER, 'persistor');
  identityService.multipleAsyncHandler(body, span.context());
  persistorService.multipleAsyncHandler(body, span.context());
  span.finish();
  res.status(200).json({ success: true });
})

module.exports = router;
