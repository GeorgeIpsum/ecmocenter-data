import { z } from "zod";
import { db } from "@/lib/db";
import { CenterType } from "../../generated/prisma/enums";
import { publicProcedure, router } from "../server";

export const ecmoCenterRouter = router({
  getAll: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const search = input?.search?.toLowerCase();

      return db.ecmoCenter.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { state: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: {
          director: true,
          coordinator: true,
          users: true,
        },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.ecmoCenter.findUnique({
        where: { id: input.id },
        include: {
          director: true,
          coordinator: true,
          users: true,
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.nativeEnum(CenterType),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        directorId: z.string(),
        coordinatorId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      return db.ecmoCenter.create({
        data: input,
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        type: z.nativeEnum(CenterType).optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        directorId: z.string().optional(),
        coordinatorId: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.ecmoCenter.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.ecmoCenter.delete({
        where: { id: input.id },
      });
    }),
});
