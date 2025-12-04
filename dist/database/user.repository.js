"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const error_handler_1 = require("../config/error.handler");
const prisma_config_1 = require("../config/prisma.config");
class UserRepository {
    // SELECT * FROM users
    async findAll() {
        try {
            const users = await prisma_config_1.prisma.user.findMany();
            return users;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // SELECT * FROM users WHERE id = ?
    async findById(id) {
        try {
            const user = await prisma_config_1.prisma.user.findUnique({
                where: { id },
            });
            return user;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // INSERT INTO users (...) VALUES (...)
    async create(data) {
        try {
            const newUser = await prisma_config_1.prisma.user.create({
                data
            });
            return newUser;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // UPDATE users SET ... WHERE id = ?
    async update(id, data) {
        try {
            const updatedUser = await prisma_config_1.prisma.user.update({
                where: { id },
                data,
            });
            return updatedUser;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // DELETE FROM users WHERE id = ?
    async delete(id) {
        try {
            const deletedUser = await prisma_config_1.prisma.user.delete({
                where: { id },
            });
            return deletedUser;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // SELECT * FROM users WHERE email = ?
    async findByEmail(email) {
        try {
            const user = await prisma_config_1.prisma.user.findUnique({
                where: { email },
            });
            return user;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // SELECT * FROM users WHERE username = ?
    async findByUsername(username) {
        try {
            const user = await prisma_config_1.prisma.user.findUnique({
                where: { username },
            });
            return user;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
}
exports.UserRepository = UserRepository;
