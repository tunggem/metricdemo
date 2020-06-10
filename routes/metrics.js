var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function streamToString (stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function processTemplate(content) {

}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  const readStream = fs.createReadStream(path.resolve('mock/data.txt'));

  let content = "";

  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    const random = Math.round(Math.random()* 100);
    content += line.replace("{{rand_int}}", random);
    content += "\n";
  }

  // const content = await streamToString(readStream);
  res.status(200).send(content);
});

module.exports = router;
