import express, {Express, } from 'express';

const middleware = [
    express.json(),
    express.urlencoded()
]

function initMiddleware(app: Express): void {

}

export default 
