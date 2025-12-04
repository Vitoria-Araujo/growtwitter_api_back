import { handleError } from "../config/error.handler";
import { prisma } from "../config/prisma.config";
import { CreateTweetDto } from "../dtos/create-tweet.dto";
import { UpdateTweetDto } from "../dtos/update-tweet.dto";

export class TweetRepository {
  // =====================================================
  // GET ALL TWEETS (WITH REPLIES RECURSIVE)
  // =====================================================
  public async findAll(maxDepth: number = 50) {
    try {
      const includeRepliesRecursive = (currentDepth: number): any => {
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

        if (currentDepth >= maxDepth) return baseInclude;

        return {
          ...baseInclude,
          replies: {
            include: includeRepliesRecursive(currentDepth + 1),
            orderBy: { createdAt: "asc" },
          },
        };
      };

      return await prisma.tweet.findMany({
        where: { parentId: null },
        include: includeRepliesRecursive(0),
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      return handleError(error);
    }
  }

  // =====================================================
  // FIND BY ID
  // =====================================================
  public async findById(id: string) {
    try {
      return await prisma.tweet.findUnique({ where: { id } });
    } catch (error: any) {
      return handleError(error);
    }
  }

  // =====================================================
  // CREATE TWEET
  // =====================================================
  public async createTweet(data: CreateTweetDto) {
    try {
      if (data.parentId) {
        const parent = await prisma.tweet.findUnique({
          where: { id: data.parentId },
        });
        if (!parent) throw new Error("Tweet original não encontrado");
      }

      return await prisma.tweet.create({
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
    } catch (error: any) {
      return handleError(error);
    }
  }

  // =====================================================
  // UPDATE TWEET
  // =====================================================
  public async update(id: string, data: UpdateTweetDto) {
    try {
      return await prisma.tweet.update({
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
    } catch (error: any) {
      return handleError(error);
    }
  }

  // =====================================================
  // DELETE TWEET
  // =====================================================
  public async delete(id: string) {
    try {
      return await prisma.tweet.delete({ where: { id } });
    } catch (error: any) {
      return handleError(error);
    }
  }

  // =====================================================
  // FEED (FOLLOWING + SELF)
  // =====================================================
  public async findFeed(userId: string, maxDepth: number = 50) {
    try {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      // Tipo correto do item retornado
      type FollowRecord = { followingId: string };

      const followingIds = following.map(
        (follow: FollowRecord) => follow.followingId
      );

      const userIds = [userId, ...followingIds];

      const includeRepliesRecursive = (currentDepth: number): any => {
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

        if (currentDepth >= maxDepth) return baseInclude;

        return {
          ...baseInclude,
          replies: {
            include: includeRepliesRecursive(currentDepth + 1),
            orderBy: { createdAt: "asc" },
          },
        };
      };

      return await prisma.tweet.findMany({
        where: {
          parentId: null,
          userId: { in: userIds },
        },
        include: includeRepliesRecursive(0),
        orderBy: { createdAt: "desc" },
      });
    } catch (error: any) {
      return handleError(error);
    }
  }
}
