import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { publicProcedure, router } from "../server";

export const userRouter = router({
  getAll: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const page = input?.page || 1;
      const limit = input?.limit || 10;
      const search = input?.search?.toLowerCase();

      const where: Prisma.UserWhereInput | undefined = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { role: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined;

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          include: {
            center: true,
            directorRole: true,
            coordinatorRole: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        db.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.user.findUnique({
        where: { id: input.id },
        include: {
          center: true,
          directorRole: true,
          coordinatorRole: true,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.string(),
        image: z.string().optional(),
        description: z.string().optional(),
        centerId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return db.user.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.string().optional(),
        image: z.string().optional(),
        description: z.string().optional(),
        centerId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.user.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.user.delete({
        where: { id: input.id },
      });
    }),
});
