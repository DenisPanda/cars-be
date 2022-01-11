import dotenv from 'dotenv';
// initialize env vars
dotenv.config();

import express, { Application, Request, Response } from "express";
import logger from "./utils/logger";
import initMiddleware from "./middleware";
import initDB from "./db";
import Vehicle from "./models/vehicles.model";
import User from "./models/user.model";
import _ from 'lodash';
import { createJWT, hash, compare } from './utils/auth';

const app: Application = express();

// should be in a dot env
const port = 3000;

// init middleware
try {
  initMiddleware(app);
  logger.info("Middleware initialized.");
} catch (e) {
  logger.error(e);
}


// in prod endpoints should be separated into controllers
//////////// ENDPOINTS //////////



// --------- LOGIN -------
app.post("/login", async (req: Request, res: Response): Promise<Response> => {
  let missing = [];

  try {
    // this should be a util function or decorator
    const required = ['email', 'password'];

    const body = req.body;

    // better solution joi but is overkill for this app
    missing = required.reduce((acc, k) => {
      if (!_.get(body, k, false)) {
        acc.push(k);
      }

      return acc;
    }, [] as string[])

    if (missing.length) {
      return res.status(400).send({
        message: `Invalid payload. Check: ${JSON.stringify(missing)}`,
      })
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: new RegExp(email, 'i') }).exec();

    if (!user) {
      logger.info(`User not found: ${email}`);

      return res.status(404).send({
        message: 'User not found!'
      })
    }

    const valid = compare(password, user.digest);

    if (!valid) {
      logger.info(`User unauthorized: ${JSON.stringify(body)}`);

      return res.status(403).send({
        message: 'User unauthorized!'
      });
    }

    const token = await createJWT(user._id);

    const data = {
      token
    };

    logger.verbose(`Login user ${JSON.stringify(user)}`);

    return res.status(200).send({
      message: 'Success',
      data
    })
  } catch (e) {
    logger.error(e);

    return res.status(500).send("Server error.");
  }
});



// ------- CREATE USER -------
app.post("/user", async (req: Request, res: Response): Promise<Response> => {
  let missing: string[] = [];

  try {
    // this should be a util function or decorator
    const required = ['email', 'password'];

    const body = req.body;

    // better solution joi but is overkill for this app
    missing = required.reduce((acc, k) => {
      if (!_.get(body, k, false)) {
        acc.push(k);
      }

      return acc;
    }, [] as string[])

    if (missing.length) {
      return res.status(400).send({
        message: `Invalid payload. Check: ${JSON.stringify(missing)}`,
      })
    }

    // check pass length
    if (
      (req.body.password as string).length <
      parseInt(process.env.PASS_LENGTH as string, 10)
    ) {
      return res.status(400).send({
        message: `Pass length must be at least ${process.env.PASS_LENGTH}`
      });
    }

    const { email, password } = req.body;

    const digest = await hash(password);

    console.log("PING PING USER")

    // create user
    const user = await new User({ email, digest }).save();

    const id = user._id;

    const token = await createJWT(id);

    // set token to return
    const data = {
      token
    }

    logger.info(`User created ${id}`);

    return res.status(201).send({
      message: 'User created! Yaaay!',
      data
    })
  } catch (e) {
    logger.info(`Can't add user.`);

    // should be an enum
    if (_.get(e, 'code', false) === 11000) {
      return res.status(409).send({
        message: "Can't add user. Already exists."
      });
    }

    logger.error(JSON.stringify(e));
    return res.status(500).send("Server error.");
  }
});



// ------ VEHICLES --------
app.get("/vehicles", async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = req.get("page") || 1;
    const limit = req.get("pageSize") || 10;

    const result = await Vehicle.paginate({ make: /./ }, {page, limit})

    logger.verbose('Get vehicles.');

    return res.status(200).send({
      count: result.count,
      page: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,

      data: result.data,
      message: "success",
    });
  } catch (e) {
    logger.error(e);

    return res.status(500).send("Server error.");
  }
});

app.post("/vehicles", async (req: Request, res: Response): Promise<Response> => {
  let missing: string[] = [];

  try {
    // this should be a util function
    const required = ['make', 'model', 'year'];

    const body = req.body;

    // better solution joi but is overkill for this app
    missing = required.reduce((acc, k) => {
      if (!_.get(body, k, false)) {
        acc.push(k);
      }

      return acc;
    }, [] as string[]);

    if (missing.length) {
      return res.status(400).send({
        message: `Invalid payload: ${JSON.stringify(missing)}`,
      })
    }

    // set only required fields
    const doc = required.reduce((acc, k) => {
      let val = _.get(body, k)

      if (typeof val === 'string') {
        val = val.toUpperCase();
      }

      acc[k] = val;

      return acc;
    }, {} as {[k: string]: string});

    const data = await Vehicle.create(doc);

    logger.info(`Vehicle created ${data.id}`);

    return res.status(201).send({
      message: 'Doc created!',
      data
    })
  } catch (e) {

    logger.info(`Can't add vehicle. ${JSON.stringify(req.body)}`);

    // should be an enum
    if (_.get(e, 'code', false) === 11000) {
      return res.status(409).send({
        message: "Can't add vehicle. Duplicate error."
      });
    }

    logger.error(e);

    return res.status(500).send("Server error.");
  }
});

///////////////////////////


// init db, then start app
try {
  initDB()
    .then(() => {
      logger.info("Database connected");

      app.listen(port, (): void => {
        logger.info(`Connected successfully on port ${port}`);
      });
    })
    .catch((err) => {
      logger.error(`Mongo failed to start:`);

      logger.error(JSON.stringify(err, null, 2));
    });
} catch (error: any) {
  logger.error(`Error occured: ${error.message}`);
}
