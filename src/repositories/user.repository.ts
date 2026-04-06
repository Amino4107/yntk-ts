import type { Prisma, User } from '../generated/prisma/client';
import prisma from '../config/prisma';

const create = (data: Prisma.UserCreateInput): Promise<any> =>
  prisma.user.create({ 
    data,
    include: { roles: { include: { permissions: true } } }
  });

const findByEmail = (email: string): Promise<any> =>
  prisma.user.findUnique({ 
    where: { email },
    include: { roles: { include: { permissions: true } } }
  });

const findById = (id: string): Promise<any> =>
  prisma.user.findUnique({ 
    where: { id },
    include: { roles: { include: { permissions: true } } }
  });

const findByIdWithPassword = (id: string): Promise<any> =>
  prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      password: true,
      emailVerified: true,
      emailVerificationToken: true,
      emailVerificationExpires: true,
      resetPasswordToken: true,
      resetPasswordExpires: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        include: { permissions: true }
      }
    },
  });

const findAll = (): Promise<User[]> => prisma.user.findMany();

const update = (id: string, data: Prisma.UserUpdateInput): Promise<User> =>
  prisma.user.update({
    where: { id },
    data,
  });

const deleteById = (id: string): Promise<User> =>
  prisma.user.delete({ where: { id } });

const saveResetToken = async (
  email: string,
  hashedToken: string,
  expiresAt: Date,
): Promise<User> =>
  prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expiresAt,
    },
  });

const findByResetToken = async (
  hashedToken: string,
): Promise<User | null> =>
  prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date(), // not expired token
      },
    },
  });

const clearResetToken = async (userId: string): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

const updatePassword = async (
  userId: string,
  hashedPassword: string,
): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

const saveVerificationToken = async (
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
    },
  });

const findByVerificationToken = async (
  token: string,
): Promise<User | null> =>
  prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        gt: new Date(), // not expired token
      },
    },
  });

const clearVerificationToken = async (userId: string): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

const updateRoles = async (userId: string, roleIds: number[]): Promise<User> =>
  prisma.user.update({
    where: { id: userId },
    data: {
      roles: {
        set: roleIds.map(id => ({ id }))
      }
    },
    include: { roles: { include: { permissions: true } } }
  });

const userRepository = {
  create,
  findByEmail,
  findById,
  findByIdWithPassword,
  findAll,
  update,
  deleteById,
  saveResetToken,
  findByResetToken,
  clearResetToken,
  updatePassword,
  saveVerificationToken,
  findByVerificationToken,
  clearVerificationToken,
  updateRoles,
};

export default userRepository;
