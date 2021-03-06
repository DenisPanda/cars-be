import dotenv from "dotenv";
// initialize env vars
dotenv.config();

import express, { Application, Request, Response } from "express";
import logger from "./utils/logger";
import initMiddleware from "./middleware";
import initDB from "./db";
import Vehicle from "./models/vehicle.model";
import User from "./models/user.model";
import _ from "lodash";
import { createJWT, hash, compare } from "./utils/auth";
import { PaginateOptions } from "mongoose";
import { PASS_LENGTH } from "./config";

const app: Application = express();

// should be in a dot env
const port = process.env.PORT || 3000;

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

// === LOGIN USER ===
app.post("/login", async (req: Request, res: Response): Promise<Response> => {
  let missing = [];

  try {
    // this should be a util function or decorator
    const required = ["email", "password"];

    const body = req.body;

    // better solution joi but is overkill for this app
    missing = required.reduce((acc, k) => {
      if (!_.get(body, k, false)) {
        acc.push(k);
      }

      return acc;
    }, [] as string[]);

    // not all attributes defined
    if (missing.length) {
      return res.status(400).send({
        message: `Invalid payload. Check: ${JSON.stringify(missing)}`,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: new RegExp(email, "i") }).exec();

    // user not found
    if (!user) {
      logger.info(`User not found: ${email}`);

      return res.status(404).send({
        message: "User not found!",
      });
    }

    const valid = compare(password, user.digest);

    // password not valid
    if (!valid) {
      logger.info(`User unauthorized: ${JSON.stringify(body)}`);

      return res.status(403).send({
        message: "User unauthorized!",
      });
    }

    const token = await createJWT(user._id);

    const data = {
      token,
      email,
    };

    logger.verbose(`Login user ${JSON.stringify(user)}`);

    return res.status(200).send({
      message: "Success",
      data,
    });
  } catch (e) {
    logger.error(e);

    return res.status(500).send("Server error.");
  }
});

// ------- CREATE USER -------

// === CREATE USER ===
app.post("/user", async (req: Request, res: Response): Promise<Response> => {
  let missing: string[] = [];

  try {
    // this should be a util function or decorator
    const required = ["email", "password"];

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
        message: `Invalid payload. Check: ${JSON.stringify(missing)}`,
      });
    }

    // check pass length
    if ((req.body.password as string).length < PASS_LENGTH) {
      return res.status(400).send({
        message: `Pass length must be at least ${PASS_LENGTH}`,
      });
    }

    const { email, password } = req.body;

    const digest = await hash(password);

    // create user
    const user = await new User({ email, digest }).save();

    const id = user._id;

    const token = await createJWT(id);

    // set token to return
    const data = {
      email,
      token,
    };

    logger.info(`User created ${id}`);

    // there should be a confirm user flow

    return res.status(201).send({
      message: "User created! Yaaay!",
      data,
    });
  } catch (e) {
    logger.info(`Can't add user.`);

    // should be an enum
    if (_.get(e, "code", false) === 11000) {
      return res.status(409).send({
        message: "Can't add user. Already exists.",
      });
    }

    logger.error(JSON.stringify(e));
    return res.status(500).send("Server error.");
  }
});

// ------ VEHICLES --------

// === GET VEHICLES ===
app.get("/vehicles", async (req: Request, res: Response): Promise<Response> => {
  try {
    const validKeys = ["make", "model", "year"];
    const page = parseInt((req.get("page") || req.query.page || 1) as string);
    const limit = parseInt(
      (req.get("pageSize") || req.query.pageSize || 10) as string
    );
    const sort = req.query.sort as string;
    const sortOrder = parseInt((req.query.sortOrder || 1) as string);

    let search: [string, string | number | RegExp] = ["make", /./];

    if (req.query) {
      // find first value that matches or assign default value
      const fromParams =
        Object.entries(
          _.pick(req.query, validKeys) as { [k: string]: string }
        ).find(([k, v]) => typeof v === "string" || typeof v === "number") ||
        null;

      // found value
      if (fromParams) {
        // only year can be a num
        search = [
          fromParams[0],
          fromParams[0] === "year"
            ? parseInt(fromParams[1])
            : new RegExp(fromParams[1], "i"),
        ];
      }
    }

    const qOpts: PaginateOptions = { page, limit, sort: { year: 1 } };

    // add sorting
    if (sort) {
      qOpts.sort = { [sort]: sortOrder };
    }

    const result = await Vehicle.paginate({ [search[0]]: search[1] }, qOpts);

    logger.debug("Get vehicles.");

    return res.status(200).send({
      pageSize: limit,
      page,
      count: result.count,
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

// === CREATE VEHICLE ===
app.post("/vehicle", async (req: Request, res: Response): Promise<Response> => {
  let missing: string[] = [];

  try {
    // this should be a util function
    const required = ["make", "model", "year"];

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
      });
    }

    // set only required fields
    const doc = required.reduce((acc, k) => {
      let val = _.get(body, k);

      if (typeof val === "string") {
        val = val.toUpperCase();
      }

      acc[k] = val;

      return acc;
    }, {} as { [k: string]: string });

    const data = await Vehicle.create(doc);

    logger.info(`Vehicle created ${data.id}`);

    return res.status(201).send({
      message: "Doc created!",
      data,
    });
  } catch (e) {
    logger.info(`Can't add vehicle. ${JSON.stringify(req.body)}`);

    // should be an enum
    if (_.get(e, "code", false) === 11000) {
      return res.status(409).send({
        message: "Can't add vehicle. Duplicate error.",
      });
    }

    logger.error(e);

    return res.status(500).send("Server error.");
  }
});

// === SEARCH VEHICLES ===
app.post(
  "/vehicles/autocomplete",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const body = req.body;

      const searchQ = body.search as string | number;
      const qValid = typeof searchQ === "string" || typeof searchQ === "number";

      if (!qValid) {
        return res.status(400).send({
          message: `Invalid payload`,
        });
      }

      const data = (await Vehicle.searchFuzzy(searchQ).exec()).reverse();

      logger.verbose(`Search vehicles  ${searchQ}`);

      return res.status(201).send({
        message: "Search success!",
        data,
      });
    } catch (e) {
      logger.error(e);

      return res.status(500).send("Server error.");
    }
  }
);

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
