import jwt from "express-jwt";
import process from "process";
import { NextFunction, Request, Response } from 'express';

// Demo app jwt middleware implementation.
// Please don't use in prod!!!

/**
 * Endpoints which we don't check
 */
const exceptions = [
  '/login',
  // all except get
  {
    url: '/user',
    methods: ['POST']
  },
  {
    url: /./,
    methods: ['GET']

    // for testing purposes
    // methods: ['GET', 'POST']
  }
];

// should have issuer, audience, but this is a demo app, so go with the flow
// also currently tokens don't expire
const jwtMiddleware = () => jwt({
  secret: process.env.JWT_SECRET as string,
  algorithms: ["HS256"],
}).unless({ path: exceptions } as any);

const errorHandler = () => (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError' ) {
    res.status(401).send('Invalid token.');
  }
}

export default [jwtMiddleware, errorHandler];