'use strict';

const SENSITIVE_KEY = /(authorization|token|secret|password|signature|customer|email|phone|address|first_?name|last_?name|(?:^|_)name$)/i;
const MAX_LOG_BODY_CHARS = Math.max(1000, Number(process.env.ORDER_FLOW_LOG_MAX_CHARS) || 12000);

function redact(value, key = '') {
  if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]));
  }
  return value;
}

function bodyText(value) {
  let serialized;
  try {
    serialized = JSON.stringify(redact(value), null, 2);
  } catch (error) {
    serialized = JSON.stringify({ logSerializationError: error.message });
  }
  if (serialized.length > MAX_LOG_BODY_CHARS) {
    return `${serialized.slice(0, MAX_LOG_BODY_CHARS)}\n... [truncated at ${MAX_LOG_BODY_CHARS} characters; set ORDER_FLOW_LOG_MAX_CHARS to increase]`;
  }
  return serialized;
}

function logRequest(step, method, url, requestBody) {
  console.info(`[ORDER FLOW] ${step}\nrequest url: ${url}\nrequest method: ${String(method).toUpperCase()}\nrequest body: ${bodyText(requestBody)}`);
}

function logResponse(step, status, responseBody) {
  console.info(`[ORDER FLOW] ${step}\nresponse status: ${status}\nresponse body: ${bodyText(responseBody)}`);
}

function logFailure(step, error) {
  logResponse(step, error.response?.status || 'NO_RESPONSE', error.response?.data || { message: error.message, code: error.code || null });
}

function attachOrderApiResponseLogger(req, res, flowId) {
  const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  logRequest(`${flowId} order API`, req.method, requestUrl, req.body || {});
  const originalJson = res.json.bind(res);
  res.json = body => {
    logResponse(`${flowId} order API`, res.statusCode, body);
    return originalJson(body);
  };
}

module.exports = { logRequest, logResponse, logFailure, attachOrderApiResponseLogger, redact };
