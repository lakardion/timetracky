import { createRouter } from "./context";

export const publicRouter = createRouter().query("hello-world", {
  resolve() {
    return "Hello world";
  },
});
