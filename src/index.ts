import { Request, Response } from "express";

import { UserRepository } from "./database/user.repository";
import express = require("express");
import cors = require("cors");
import * as dotenv from "dotenv";
import { prisma } from "./config/prisma.config";
import * as bcrypt from "bcrypt";
import { TweetRepository } from "./database/tweet.repository";
import { LikeRepository } from "./database/like.repository";
import { FollowRepository } from "./database/follow.repository";

import {
  authMiddleware,
  validateUserCreation,
  validateTweetCreation,
  validateIdParam,
  validateUserLogin,
  validateLike,
  validateFollow,
  validateOwnership,
  validateFollowOwnership,
} from "./config/middlewares";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const userRepository = new UserRepository();
const tweetRepository = new TweetRepository();
const likeRepository = new LikeRepository();
const followRepository = new FollowRepository();

/* USERS -------------------------------------------------------------- */

// 1 - Get all users
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await userRepository.findAll();
    res.status(200).send({
      ok: true,
      message: "All users:",
      data: users,
    });
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// 2 - Get user by ID
app.get(
  "/user/:id",
  authMiddleware,
  validateIdParam,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
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

      const followers = await prisma.follow.findMany({
        where: { followingId: id },
        include: { follower: true },
      });

      const following = await prisma.follow.findMany({
        where: { followerId: id },
        include: { following: true },
      });

      res.status(200).json({
        ok: true,
        message: "User found:",
        data: { ...user, followers, following },
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  }
);

// 3 - Create user
app.post("/user", validateUserCreation, async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Prevent TS error and ensure newUser exists
    if (!newUser) {
      return res
        .status(500)
        .send({ ok: false, message: "Error creating user (null returned)" });
    }

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
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

// 4 - Update user
app.put(
  "/user/:id",
  authMiddleware,
  validateIdParam,
  validateOwnership("user"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const updatedUser = await userRepository.update(id, req.body);

      if (!updatedUser) {
        return res.status(404).send({ ok: false, message: "User not found" });
      }

      res.status(200).send({
        ok: true,
        message: "User updated successfully:",
        data: updatedUser,
      });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }
);

// 5 - Delete user
app.delete(
  "/user/:id",
  authMiddleware,
  validateIdParam,
  validateOwnership("user"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deletedUser = await userRepository.delete(id);

      if (!deletedUser) {
        return res.status(404).send({ ok: false, message: "User not found" });
      }

      res.status(200).send({
        ok: true,
        message: "User deleted",
        data: deletedUser,
      });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  }
);

/* LOGIN -------------------------------------------------------------- */

app.post("/login", validateUserLogin, async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    let user = await userRepository.findByEmail(login);
    if (!user) user = await userRepository.findByUsername(login);

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
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

/* TWEETS -------------------------------------------------------------- */

app.get("/tweets", async (req: Request, res: Response) => {
  try {
    const tweets = await tweetRepository.findAll();
    res.status(200).send({ ok: true, data: tweets });
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error fetching tweets",
      error: error.message,
    });
  }
});

app.post(
  "/tweet",
  authMiddleware,
  validateTweetCreation,
  validateOwnership("tweet"),
  async (req: Request, res: Response) => {
    try {
      const newTweet = await tweetRepository.createTweet(req.body);
      res
        .status(201)
        .send({ ok: true, message: "Tweet created", data: newTweet });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error creating tweet",
        error: error.message,
      });
    }
  }
);

/* LIKES -------------------------------------------------------------- */

app.post(
  "/like/:userId/:tweetId",
  authMiddleware,
  validateLike,
  validateOwnership("like"),
  async (req: Request, res: Response) => {
    try {
      const { userId, tweetId } = req.params;

      const newLike = await likeRepository.likeTweet({ userId, tweetId });

      if (!newLike) {
        return res.status(400).send({ ok: false, message: "Already liked" });
      }

      res.status(200).send({ ok: true, message: "Tweet liked", data: newLike });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error liking tweet",
        error: error.message,
      });
    }
  }
);

app.delete(
  "/like/:id",
  authMiddleware,
  validateIdParam,
  validateOwnership("like"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const deletedLike = await likeRepository.unlikeTweet(id);

      res.status(200).send({
        ok: true,
        message: "Like removed",
        data: deletedLike,
      });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error unliking tweet",
        error: error.message,
      });
    }
  }
);

/* FOLLOWS -------------------------------------------------------------- */

app.get("/follows", async (req: Request, res: Response) => {
  try {
    const follows = await followRepository.findAll();
    res.status(200).send({ ok: true, data: follows });
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error fetching follows",
      error: error.message,
    });
  }
});

app.post(
  "/follow",
  authMiddleware,
  validateFollow,
  validateFollowOwnership,
  async (req: Request, res: Response) => {
    try {
      const newFollow = await followRepository.followUser(req.body);

      if (!newFollow) {
        return res
          .status(400)
          .send({ ok: false, message: "Already following" });
      }

      res.status(200).send({ ok: true, message: "Followed", data: newFollow });
    } catch (error: any) {
      res.status(500).send({
        ok: false,
        message: "Error following user",
        error: error.message,
      });
    }
  }
);

/* FEED -------------------------------------------------------------- */

app.get("/feed", authMiddleware, async (req: Request, res: Response) => {
  try {
    const authenticatedUser = (req as any).user;
    const feed = await tweetRepository.findFeed(authenticatedUser.id);

    res.status(200).send({ ok: true, data: feed });
  } catch (error: any) {
    res.status(500).send({
      ok: false,
      message: "Error fetching feed",
      error: error.message,
    });
  }
});

/* SERVER -------------------------------------------------------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});
