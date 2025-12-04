"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowRepository = void 0;
const error_handler_1 = require("../config/error.handler");
const prisma_config_1 = require("../config/prisma.config");
class FollowRepository {
    async findAll() {
        try {
            const follows = await prisma_config_1.prisma.follow.findMany({
                include: {
                    following: {
                        select: {
                            name: true,
                            username: true
                        }
                    },
                    follower: {
                        select: {
                            name: true,
                            username: true
                        }
                    }
                }
            });
            return follows;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // Follow a user
    async followUser(data) {
        try {
            // User cannot follow themselves
            if (data.followerId === data.followingId) {
                throw new Error("User cannot follow themselves");
            }
            // Check if the user to be followed exists
            const userToFollow = await prisma_config_1.prisma.user.findUnique({
                where: { id: data.followingId }
            });
            if (!userToFollow) {
                throw new Error("User not found");
            }
            // Check if already following (prevent duplicate follow)
            const existingFollow = await prisma_config_1.prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: data.followerId,
                        followingId: data.followingId
                    }
                }
            });
            if (existingFollow) {
                throw new Error("You are already following this user");
            }
            // Create the follow
            const follow = await prisma_config_1.prisma.follow.create({
                data: {
                    followerId: data.followerId,
                    followingId: data.followingId
                }
            });
            return follow;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // Unfollow a user
    async unfollowUser(data) {
        try {
            const follow = await prisma_config_1.prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: data.followerId,
                        followingId: data.followingId
                    }
                }
            });
            return follow;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
}
exports.FollowRepository = FollowRepository;
