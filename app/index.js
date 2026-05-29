const express = require('express');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { metrics } = require('@opentelemetry/api');

// Prometheus exporter
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// --- OTel SDK setup ---
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'obs-app',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'grpc://otel-collector:4317',   // send metrics to OTEL Collector
    }),
    exportIntervalMillis: 5000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Prometheus exporter setup
const prometheusExporter = new PrometheusExporter(
  { port: 9464, endpoint: '/metrics' },
  () => {
    console.log('Prometheus scrape endpoint: http://localhost:9464/metrics');
  }
);
sdk.configure({ metricReader: prometheusExporter });

sdk.start();

// --- Express app ---
const app = express();

// Custom metric: request counter
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
