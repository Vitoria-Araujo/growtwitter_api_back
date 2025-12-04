"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweetRepository = void 0;
const error_handler_1 = require("../config/error.handler");
const prisma_config_1 = require("../config/prisma.config");
class TweetRepository {
    // =====================================================
    // GET ALL TWEETS (WITH REPLIES RECURSIVE)
    // =====================================================
    async findAll(maxDepth = 50) {
        try {
            const includeRepliesRecursive = (currentDepth) => {
                const baseInclude = {
                    user: {
                        select: { id: true, name: true, username: true },
                    },
                    _count: {
                        select: { likes: true, replies: true },
                    },
                    likes: {
                        include: {
                            user: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                };
                if (currentDepth >= maxDepth)
                    return baseInclude;
                return {
                    ...baseInclude,
                    replies: {
                        include: includeRepliesRecursive(currentDepth + 1),
                        orderBy: { createdAt: "asc" },
                    },
                };
            };
            return await prisma_config_1.prisma.tweet.findMany({
                where: { parentId: null },
                include: includeRepliesRecursive(0),
                orderBy: { createdAt: "desc" },
            });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // =====================================================
    // FIND BY ID
    // =====================================================
    async findById(id) {
        try {
            return await prisma_config_1.prisma.tweet.findUnique({ where: { id } });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // =====================================================
    // CREATE TWEET
    // =====================================================
    async createTweet(data) {
        try {
            if (data.parentId) {
                const parent = await prisma_config_1.prisma.tweet.findUnique({
                    where: { id: data.parentId },
                });
                if (!parent)
                    throw new Error("Tweet original não encontrado");
            }
            return await prisma_config_1.prisma.tweet.create({
                data: {
                    content: data.content,
                    userId: data.userId,
                    parentId: data.parentId || null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            profileImage: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // =====================================================
    // UPDATE TWEET
    // =====================================================
    async update(id, data) {
        try {
            return await prisma_config_1.prisma.tweet.update({
                where: { id },
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            profileImage: true,
                        },
                    },
                    likes: true,
                    replies: true,
                },
            });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // =====================================================
    // DELETE TWEET
    // =====================================================
    async delete(id) {
        try {
            return await prisma_config_1.prisma.tweet.delete({ where: { id } });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    // =====================================================
    // FEED (FOLLOWING + SELF)
    // =====================================================
    async findFeed(userId, maxDepth = 50) {
        try {
            const following = await prisma_config_1.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            });
            const followingIds = following.map((follow) => follow.followingId);
            const userIds = [userId, ...followingIds];
            const includeRepliesRecursive = (currentDepth) => {
                const baseInclude = {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            profileImage: true,
                        },
                    },
                    _count: {
                        select: { likes: true, replies: true },
                    },
                    likes: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                },
                            },
                        },
                    },
                };
                if (currentDepth >= maxDepth)
                    return baseInclude;
                return {
                    ...baseInclude,
                    replies: {
                        include: includeRepliesRecursive(currentDepth + 1),
                        orderBy: { createdAt: "asc" },
                    },
                };
            };
            return await prisma_config_1.prisma.tweet.findMany({
                where: {
                    parentId: null,
                    userId: { in: userIds },
                },
                include: includeRepliesRecursive(0),
                orderBy: { createdAt: "desc" },
            });
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
}
exports.TweetRepository = TweetRepository;
