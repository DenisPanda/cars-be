import express, { Application, Request, Response } from "express";
import logger from "./utils/logger";
import initMiddleware from "./middleware";
import initDB from "./db";
import Vehicle from "./models/vehicles.model";
import _ from 'lodash';

const app: Application = express();

// should be in a dot env
const port = 3000;

try {
  initMiddleware(app);
  logger.info("Middleware initialized.");
} catch (e) {
  logger.error(e);
}

app.get("/login", async (req: Request, res: Response): Promise<Response> => {
  try {
    const data = await Vehicle.find({ make: /ford/i });

    return res.status(200).send({
      data,
      message: "Hello World!",
    });
  } catch (e) {
    logger.info("Request failed");
    return res.status(500).send("Server error.");
  }
});

app.get("/vehicles", async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = req.get("page") || 1;
    const limit = req.get("pageSize") || 10;

    // const data = await Vehicle.find({ make: /ford/i });
    const result = await Vehicle.paginate({ make: /ford/i }, {page, limit})

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
    console.log('Boyd', body)

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


    const doc = required.reduce((acc, k) => {
      let val = _.get(body, k)

      if (typeof val === 'string') {
        val = val.toUpperCase();
      }

      acc[k] = _.get(body, k)

      return acc;
    }, {} as any);

    const data = await Vehicle.create(doc);

    return res.status(201).send({
      message: 'Doc created!',
      data
    })
  } catch (e) {
    logger.error(e);

    // should be an enum
    if (_.get(e, 'code', false) === 11000) {
      return res.status(409).send({
        message: "Can't add doc. Duplicate error."
      });
    }

    console.log('Mongo res', JSON.stringify(e, null, 2));

    return res.status(500).send("Server error.");
  }
});


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
