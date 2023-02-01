import jwt from 'jsonwebtoken';

//send JWT token to the user
export const sendToken = (id, res, data = {}) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.status(200).cookie('token', token, cookieOptions).json({
    success: true,
    token,
    data,
  });
};
