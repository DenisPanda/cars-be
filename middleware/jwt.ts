import { Request, Response } from 'express';
import jwt from "express-jwt";
import process from 'process';
// jwt implementation WIP

const exceptions = (req: Request) =>
  req.method === "post" && req.path.match("/login$/");


const jwtMiddleware = (req: Request) => {
    // check all write && delete operations
    const shouldCheck = req.method === 'POST' || req.method === 'DELETE';

    if (shouldCheck && !exceptions(req)) {

    }
}