import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const COOKIE_NAME = 'rescuebite_jwt';

export const generateToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

export const getCookieOptions = () => {
  const isSecure = ENV.COOKIE_SECURE;
  const sameSite = process.env.COOKIE_SAME_SITE || (isSecure ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  };
};

export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
};
