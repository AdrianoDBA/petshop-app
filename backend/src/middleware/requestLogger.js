import logger from '../logger.js';

const SENSITIVE_FIELDS = ['senha', 'password', 'token', 'authorization', 'cpf', 'confirmarSenha'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
}

function requestLogger(req, res, next) {
  logger.info({
    method: req.method,
    url: req.url,
    headers: sanitize(req.headers),
    body: sanitize(req.body),
    timestamp: new Date().toISOString()
  });

  const originalSend = res.send;
  res.send = function (data) {
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseBody: typeof data === 'string' && data.length < 1000 ? data : '[Response too large to log]',
      timestamp: new Date().toISOString()
    });

    return originalSend.call(this, data);
  };

  next();
}

export default requestLogger;
