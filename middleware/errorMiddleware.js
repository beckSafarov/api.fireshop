const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Invalid id';
  }
  if (err.code === 11000) {
    statusCode = 404;
    message = err.keyValue.email
      ? 'Such email already exists'
      : 'Duplicate value error';
  }

  // console.log(err.name);
  console.log(err);

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
