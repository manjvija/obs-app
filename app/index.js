const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader, MeterProvider } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// OTel SDK setup
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'obs-app',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'grpc://otel-collector:4317',   // points to OTel collector service
    }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

const express = require('express');
const app = express();

// Custom metric: request counter
const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('obs-app');
const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

app.get('/', (req, res) => {
  requestCounter.add(1, { route: '/', method: 'GET' });
  res.json({ message: 'Hello from OBS app!', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('App running on port 3000'));
