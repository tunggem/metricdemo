function createEvent({ type, data, source, targets, tracingData }) {
  return {
    data,
    source,
    typeName: type,
    targets,
    tracingData
  }
}

module.exports = createEvent;