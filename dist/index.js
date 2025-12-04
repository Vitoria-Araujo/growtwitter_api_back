"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("./database/user.repository");
const express = require("express");
const cors = require("cors");
const dotenv = __importStar(require("dotenv"));
const prisma_config_1 = require("./config/prisma.config");
const bcrypt = __importStar(require("bcrypt"));
const tweet_repository_1 = require("./database/tweet.repository");
const like_repository_1 = require("./database/like.repository");
const follow_repository_1 = require("./database/follow.repository");
const middlewares_1 = require("./config/middlewares");
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const userRepository = new user_repository_1.UserRepository();
const tweetRepository = new tweet_repository_1.TweetRepository();
const likeRepository = new like_repository_1.LikeRepository();
const followRepository = new follow_repository_1.FollowRepository();
// USERS ---------------------------------------------------------------------
// 1 - Get all users
app.get("/users", async (req, res) => {
    try {
        const users = await userRepository.findAll();
        res.status(200).send({
            ok: true,
            message: "All users:",
            data: users,
        });
    }
    catch (error) {
        res.status(500).send({
            ok: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
});
// 2 - Get user by ID
app.get("/user/:id", middlewares_1.authMiddleware, middlewares_1.validateIdParam, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_config_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                username: true,
                tweets: { orderBy: { createdAt: "desc" } },
            },
        });
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        const followers = await prisma_config_1.prisma.follow.findMany({
            where: { followingId: id },
            include: { follower: true },
        });
        const following = await prisma_config_1.prisma.follow.findMany({
            where: { followerId: id },
            include: { following: true },
        });
        res.status(200).json({
            ok: true,
            message: "User found:",
            data: { ...user, followers, following },
        });
    }
    catch (error) {
        res
            .status(500)
            .json({
            ok: false,
            message: "Error fetching user",
            error: error.message,
        });
    }
});
// 3 - Create user
app.post("/user", middlewares_1.validateUserCreation, async (req, res) => {
    try {
        const userData = req.body;
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = await userRepository.create({
            ...userData,
            password: hashedPassword,
        });
        const userWithoutPassword = {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            profileImage: newUser.profileImage,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
        };
        res.status(201).send({
            ok: true,
            message: "User created successfully:",
            data: userWithoutPassword,
        });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error creating user",
            error: error.message,
        });
    }
});
// 4 - Update user
app.put("/user/:id", middlewares_1.authMiddleware, middlewares_1.validateIdParam, (0, middlewares_1.validateOwnership)("user"), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await userRepository.update(id, req.body);
        if (!updatedUser) {
            return res.status(404).send({ ok: false, message: "User not found" });
        }
        res
            .status(200)
            .send({
            ok: true,
            message: "User updated successfully:",
            data: updatedUser,
        });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error updating user",
            error: error.message,
        });
    }
});
// 5 - Delete user
app.delete("/user/:id", middlewares_1.authMiddleware, middlewares_1.validateIdParam, (0, middlewares_1.validateOwnership)("user"), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await userRepository.delete(id);
        if (!deletedUser) {
            return res.status(404).send({ ok: false, message: "User not found" });
        }
        res
            .status(200)
            .send({ ok: true, message: "User deleted", data: deletedUser });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error deleting user",
            error: error.message,
        });
    }
});
// LOGIN ---------------------------------------------------------------------
app.post("/login", middlewares_1.validateUserLogin, async (req, res) => {
    try {
        const { login, password } = req.body;
        let user = await userRepository.findByEmail(login);
        if (!user)
            user = await userRepository.findByUsername(login);
        if (!user) {
            return res
                .status(404)
                .send({ ok: false, message: "Invalid login credentials" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).send({ ok: false, message: "Invalid password" });
        }
        const token = `token-${user.id}`;
        res.status(200).send({
            ok: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                },
                token,
            },
        });
    }
    catch (error) {
        res
            .status(500)
            .send({ ok: false, message: "Error logging in", error: error.message });
    }
});
// TWEETS ---------------------------------------------------------------------
app.get("/tweets", async (req, res) => {
    try {
        const tweets = await tweetRepository.findAll();
        res.status(200).send({ ok: true, data: tweets });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error fetching tweets",
            error: error.message,
        });
    }
});
app.post("/tweet", middlewares_1.authMiddleware, middlewares_1.validateTweetCreation, (0, middlewares_1.validateOwnership)("tweet"), async (req, res) => {
    try {
        const newTweet = await tweetRepository.createTweet(req.body);
        res
            .status(201)
            .send({ ok: true, message: "Tweet created", data: newTweet });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error creating tweet",
            error: error.message,
        });
    }
});
// LIKES ---------------------------------------------------------------------
app.post("/like/:userId/:tweetId", middlewares_1.authMiddleware, middlewares_1.validateLike, (0, middlewares_1.validateOwnership)("like"), async (req, res) => {
    try {
        const { userId, tweetId } = req.params;
        const newLike = await likeRepository.likeTweet({ userId, tweetId });
        if (!newLike) {
            return res.status(400).send({ ok: false, message: "Already liked" });
        }
        res.status(200).send({ ok: true, message: "Tweet liked", data: newLike });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error liking tweet",
            error: error.message,
        });
    }
});
app.delete("/like/:id", middlewares_1.authMiddleware, middlewares_1.validateIdParam, (0, middlewares_1.validateOwnership)("like"), async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLike = await likeRepository.unlikeTweet(id);
        res
            .status(200)
            .send({ ok: true, message: "Like removed", data: deletedLike });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error unliking tweet",
            error: error.message,
        });
    }
});
// FOLLOWS ---------------------------------------------------------------------
app.get("/follows", async (req, res) => {
    try {
        const follows = await followRepository.findAll();
        res.status(200).send({ ok: true, data: follows });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error fetching follows",
            error: error.message,
        });
    }
});
app.post("/follow", middlewares_1.authMiddleware, middlewares_1.validateFollow, middlewares_1.validateFollowOwnership, async (req, res) => {
    try {
        const newFollow = await followRepository.followUser(req.body);
        if (!newFollow) {
            return res
                .status(400)
                .send({ ok: false, message: "Already following" });
        }
        res.status(200).send({ ok: true, message: "Followed", data: newFollow });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error following user",
            error: error.message,
        });
    }
});
// FEED ---------------------------------------------------------------------
app.get("/feed", middlewares_1.authMiddleware, async (req, res) => {
    try {
        const authenticatedUser = req.user;
        const feed = await tweetRepository.findFeed(authenticatedUser.id);
        res.status(200).send({ ok: true, data: feed });
    }
    catch (error) {
        res
            .status(500)
            .send({
            ok: false,
            message: "Error fetching feed",
            error: error.message,
        });
    }
});
// SERVER ---------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
