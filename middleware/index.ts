import express, { Application } from "express";
import jwtMiddleware from "./jwt";
import morgan from "morgan";
import cors from 'cors';

const middleware = [
  // DON'T use in production if I didn't make it clear enough :)
  // everybody can make a reques
  cors(),
  // maybe redundant, better solution to make own function with winston
  morgan("combined"),
  express.json(),
  express.urlencoded({ extended: true }),
  ...jwtMiddleware.map((m) => m()),
];

/**
 * Initialize all middleware.
 * @param app express app instance
 */
function initMiddleware(app: Application): void {
  middleware.forEach((m) => app.use(m));
}

export { jwtMiddleware };

export default initMiddleware;
