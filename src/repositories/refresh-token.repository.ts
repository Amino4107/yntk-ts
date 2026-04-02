import prisma from '../config/prisma';

export const saveRefreshToken = async (
  userId: number,
  token: string,
  expiresAt: Date,
) => {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
};

export const deleteRefreshToken = async (token: string) => {
  // Use deleteMany to avoid errors if token doesn't exist
  return prisma.refreshToken.deleteMany({
    where: { token },
  });
};

export const deleteAllRefreshTokensForUser = async (userId: number) => {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
};

export const deleteExpiredRefreshTokens = async () => {
  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
};

const refreshTokenRepository = {
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokensForUser,
  deleteExpiredRefreshTokens,
};

export default refreshTokenRepository;
