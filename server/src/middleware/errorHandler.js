const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Route Error:", err.message);

  // Never send raw stack traces or unhandled 500 to search engine bots
  if (err.name === 'CastError' || err.name === 'BSONError') {
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(410).send("<h1>410 Gone</h1><p>Invalid entity reference.</p>");
  }

  if (req.path && req.path.startsWith('/api')) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(500).send("<h1>Server Error</h1><p>Please try again later.</p>");
};

module.exports = errorHandler;
