import { Request } from 'express';
import { Mongoose } from 'mongoose';

declare global {
    namespace Express {
        export interface Request {
            test: string;
        }
    }

    namespace Mongoose {
        export interface Model {
            lucy: string
        }
    }
}