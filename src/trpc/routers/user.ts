import { z } from "zod";
import { router, publicProcedure } from "../server";
import { db } from "@/lib/db";

export const userRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.user.findMany({
      include: {
        center: true,
        directorRole: true,
        coordinatorRole: true,
      },
    });
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
      })
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
      })
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
