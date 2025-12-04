"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeRepository = void 0;
const error_handler_1 = require("../config/error.handler");
const prisma_config_1 = require("../config/prisma.config");
class LikeRepository {
    async findById(id) {
        try {
            if (!id) {
                throw new Error("No ID added");
            }
            const like = await prisma_config_1.prisma.like.findUnique({
                where: { id },
            });
            if (!like) {
                throw new Error("Like not found");
            }
            return like;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    async likeTweet(data) {
        try {
            // Check if tweet exists
            const tweet = await prisma_config_1.prisma.tweet.findUnique({
                where: { id: data.tweetId }
            });
            if (!tweet) {
                throw new Error("Tweet não encontrado");
            }
            // Check if user already liked the tweet (prevent duplicate like)
            const existingLike = await prisma_config_1.prisma.like.findUnique({
                where: {
                    userId_tweetId: {
                        userId: data.userId,
                        tweetId: data.tweetId
                    }
                }
            });
            if (existingLike) {
                throw new Error("You already liked this tweet");
            }
            // Create the like
            const like = await prisma_config_1.prisma.like.create({
                data: {
                    userId: data.userId,
                    tweetId: data.tweetId
                }
            });
            return like;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
    async unlikeTweet(id) {
        try {
            if (!id) {
                throw new Error("Like not found");
            }
            const like = await prisma_config_1.prisma.like.delete({
                where: {
                    id
                }
            });
            return like;
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    }
}
exports.LikeRepository = LikeRepository;
