import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';

// Auth Rate Limiter (Registration & Login)
export const authRateLimiter = ENV.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // limit each IP to 20 requests per windowMs
      message: {
        success: false,
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

// General API Rate Limiter
export const generalRateLimiter = ENV.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 120, // limit each IP to 120 requests per minute
      message: {
        success: false,
        message: 'Too many requests. Please slow down.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
