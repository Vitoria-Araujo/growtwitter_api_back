"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFollowOwnership = exports.validateOwnership = exports.validateFollow = exports.validateLike = exports.validateUserLogin = exports.validateIdParam = exports.validateTweetCreation = exports.validateUserCreation = exports.authMiddleware = void 0;
const user_repository_1 = require("../database/user.repository");
const error_handler_1 = require("./error.handler");
const prisma_config_1 = require("./prisma.config");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                ok: false,
                message: 'Authentication token is required'
            });
        }
        const tokenValue = token.replace('Bearer ', '');
        if (!tokenValue.startsWith('token-')) {
            return res.status(401).json({
                ok: false,
                message: 'Invalid token format'
            });
        }
        const userId = tokenValue.replace('token-', '');
        if (!userId) {
            return res.status(401).json({
                ok: false,
                message: 'Invalid token'
            });
        }
        const userRepository = new user_repository_1.UserRepository();
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(401).json({
                ok: false,
                message: 'User not found'
            });
        }
        req.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email
        };
        console.log(`Authenticated user: ${user.name} (${user.id})`);
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.authMiddleware = authMiddleware;
const validateUserCreation = (req, res, next) => {
    try {
        const { name, username, email, password } = req.body;
        if (!name || !username || !email || !password) {
            return res.status(400).json({
                ok: false,
                message: 'Name, username, email and password are required'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                ok: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateUserCreation = validateUserCreation;
const validateTweetCreation = (req, res, next) => {
    try {
        const tweetData = req.body;
        if (!tweetData.userId) {
            return res.status(400).json({
                ok: false,
                message: "userId is required"
            });
        }
        if (!tweetData.content || tweetData.content.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Content is required"
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateTweetCreation = validateTweetCreation;
const validateIdParam = (req, res, next) => {
    try {
        const id = req.params.id;
        if (!id || id.trim().length === 0 || id === 'undefined' || id === 'null') {
            return res.status(400).json({
                ok: false,
                message: 'ID is required'
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateIdParam = validateIdParam;
const validateUserLogin = (req, res, next) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({
                ok: false,
                message: 'Login and password are required'
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateUserLogin = validateUserLogin;
const validateLike = (req, res, next) => {
    try {
        if (!req.body) {
            req.body = {};
        }
        const userId = req.params.userId || req.body.userId;
        const tweetId = req.params.tweetId || req.body.tweetId;
        if (!userId || userId.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                message: 'User ID is required'
            });
        }
        if (!tweetId || tweetId.trim().length === 0) {
            return res.status(400).json({
                ok: false,
                message: 'Tweet ID is required'
            });
        }
        req.body.userId = userId;
        req.body.tweetId = tweetId;
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateLike = validateLike;
const validateFollow = (req, res, next) => {
    try {
        const { followerId, followingId } = req.body;
        if (!followerId) {
            return res.status(400).json({
                ok: false,
                message: 'Follower ID is required'
            });
        }
        if (!followingId) {
            return res.status(400).json({
                ok: false,
                message: 'Following ID is required'
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateFollow = validateFollow;
const validateOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const authenticatedUser = req.user;
            let resourceOwnerId;
            switch (resourceType) {
                case 'user':
                    if (!req.params.id || req.params.id.trim().length === 0 || req.params.id === 'undefined' || req.params.id === 'null') {
                        return res.status(400).json({
                            ok: false,
                            message: 'User ID is required'
                        });
                    }
                    resourceOwnerId = req.params.id;
                    break;
                case 'tweet':
                    if (req.params.id) {
                        // For updating/deleting existing tweet
                        const tweet = await prisma_config_1.prisma.tweet.findUnique({
                            where: { id: req.params.id },
                            select: { userId: true }
                        });
                        if (!tweet) {
                            return res.status(404).json({
                                ok: false,
                                message: 'Tweet not found'
                            });
                        }
                        resourceOwnerId = tweet.userId;
                    }
                    else {
                        // For creating new tweet
                        resourceOwnerId = req.body.userId;
                    }
                    break;
                case 'like':
                    if (req.params.id) {
                        // For deleting like by like ID
                        const like = await prisma_config_1.prisma.like.findUnique({
                            where: { id: req.params.id },
                            select: { userId: true }
                        });
                        if (!like) {
                            return res.status(404).json({
                                ok: false,
                                message: 'Like not found'
                            });
                        }
                        resourceOwnerId = like.userId;
                    }
                    else {
                        // For creating like
                        resourceOwnerId = req.params.userId || req.body.userId;
                    }
                    break;
                default:
                    return res.status(400).json({
                        ok: false,
                        message: 'Invalid resource type'
                    });
            }
            // Verify if the authenticated user is the owner of the resource
            if (authenticatedUser.id !== resourceOwnerId) {
                return res.status(403).json({
                    ok: false,
                    message: 'You are not authorized to perform this action'
                });
            }
            next();
        }
        catch (error) {
            return (0, error_handler_1.handleError)(error);
        }
    };
};
exports.validateOwnership = validateOwnership;
const validateFollowOwnership = async (req, res, next) => {
    try {
        const authenticatedUser = req.user;
        const { followerId } = req.body;
        // Verify if the authenticated user is the one trying to follow
        if (authenticatedUser.id !== followerId) {
            return res.status(403).json({
                ok: false,
                message: 'You can only perform follow actions for your own account'
            });
        }
        next();
    }
    catch (error) {
        return (0, error_handler_1.handleError)(error);
    }
};
exports.validateFollowOwnership = validateFollowOwnership;
