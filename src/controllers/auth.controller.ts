import type { Request, Response } from 'express';
import authService from '../services/auth.service';
import { handleControllerError } from './controller-utils';
import env from '../config/env';

const register = async (req: Request, res: Response) => {
  try {
    const { username, displayName, email, password } = req.body;

    const user = await authService.register({
      username,
      displayName,
      email,
      password,
    });

    return res.json({
      status: 'success',
      message: 'User created successfully!',
      data: user,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({
      email,
      password,
    });

    if (env.enableRefreshToken && env.refreshTokenInCookie && result.refreshToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: env.cookieSameSite,
        maxAge: env.refreshTokenExpiry,
      };
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
    }

    if (!env.refreshTokenInJson && result.refreshToken) {
      delete result.refreshToken;
    }

    return res.json({
      status: 'success',
      message: 'User logged in successfully!',
      data: result,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};
    
    const token = req.body.refreshToken || cookies.refreshToken;

    const result = await authService.logout(req.userData?.id, token);

    if (env.enableRefreshToken && env.refreshTokenInCookie) {
      res.clearCookie('refreshToken');
    }

    return res.json({
      status: 'success',
      message: result.message || 'User logged out successfully!',
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  try {
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const token = req.body.refreshToken || cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(token);

    if (env.enableRefreshToken && env.refreshTokenInCookie && result.refreshToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: env.cookieSameSite,
        maxAge: env.refreshTokenExpiry,
      };
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
    }

    if (!env.refreshTokenInJson && result.refreshToken) {
      delete (result as any).refreshToken;
    }

    return res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    return res.json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    return res.json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const result = await authService.verifyEmail(token);

    return res.json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await authService.resendVerification(email);

    return res.json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const getMe = async (req: Request, res: Response) => {
  try {
    const userData = req.userData;
    
    if (!userData) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthenticated',
      });
    }

    return res.json({
      status: 'success',
      message: 'User profile retrieved successfully',
      data: userData,
    });
  } catch (error) {
    return handleControllerError(error, res);
  }
};

const authController = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
};

export default authController;
