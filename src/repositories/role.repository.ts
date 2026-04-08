import prisma from '../config/prisma';
import type { Prisma, Role } from '../generated/prisma/client';

const findAll = async (
  skip?: number,
  take?: number,
  orderBy?: Prisma.RoleOrderByWithRelationInput,
  search?: string
): Promise<{ data: any[]; total: number }> => {
  const where: Prisma.RoleWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.role.findMany({
      where,
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
      ...(orderBy !== undefined && { orderBy }),
      include: {
        permissions: {
          select: { id: true, name: true, description: true }
        },
        _count: {
          select: { users: true }
        }
      },
    }),
    prisma.role.count({ where }),
  ]);
  return { data, total };
};

const findById = (id: number): Promise<any | null> =>
  prisma.role.findUnique({
    where: { id },
    include: {
      permissions: true
    }
  });

const findByName = (name: string): Promise<Role | null> =>
  prisma.role.findUnique({
    where: { name },
  });

// Instead of Prisma.RoleCreateInput we pass explicit params because permissions is an array of IDs
const create = (data: { name: string; description?: string | undefined; permissionIds: number[] }): Promise<Role> =>
  prisma.role.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      permissions: {
        connect: data.permissionIds.map(id => ({ id }))
      }
    },
    include: { permissions: true }
  });

const update = (id: number, data: { name?: string | undefined; description?: string | undefined; permissionIds?: number[] | undefined }): Promise<Role> => {
  const updateData: Prisma.RoleUpdateInput = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  
  // If permissionIds is provided, we use 'set' to replace the existing array of permissions entirely
  if (data.permissionIds !== undefined) {
    updateData.permissions = {
      set: data.permissionIds.map(permId => ({ id: permId }))
    };
  }

  return prisma.role.update({
    where: { id },
    data: updateData,
    include: { permissions: true }
  });
};

const deleteById = (id: number): Promise<Role> =>
  prisma.role.delete({ where: { id } });

const roleRepository = {
  findAll,
  findById,
  findByName,
  create,
  update,
  deleteById,
};

export default roleRepository;