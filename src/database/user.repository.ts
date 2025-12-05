import { prisma } from "../config/prisma.config";
import { CreateUserDto } from "../dtos/create-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";

export class UserRepository {
  public async findAll() {
    try {
      return await prisma.user.findMany();
    } catch (error: any) {
      throw error;
    }
  }

  public async findById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw error;
    }
  }

  public async create(data: CreateUserDto) {
    try {
      const newUser = await prisma.user.create({ data });
      return newUser;
    } catch (error: any) {
      throw error; // ← ESSA ERA A ORIGEM DO ERRO 500
    }
  }

  public async update(id: string, data: UpdateUserDto) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      throw error;
    }
  }

  public async delete(id: string) {
    try {
      return await prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      throw error;
    }
  }

  public async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error: any) {
      throw error;
    }
  }

  public async findByUsername(username: string) {
    try {
      return await prisma.user.findUnique({
        where: { username },
      });
    } catch (error: any) {
      throw error;
    }
  }
}
