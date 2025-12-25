import { router } from "./server";
import { ecmoCenterRouter } from "./routers/ecmoCenter";
import { userRouter } from "./routers/user";

export const appRouter = router({
  ecmoCenter: ecmoCenterRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
