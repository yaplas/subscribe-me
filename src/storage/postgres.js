import { Pool } from "pg";
import Cursor from "pg-cursor";
import uuid from "uuid/v4";
import * as C from "../modules/composition";

const getPool = options =>
  new Pool(C.pick(["user", "host", "database", "password", "port"], options));

const init = table => client =>
  client.query(
    `CREATE TABLE IF NOT EXISTS ${table}(
      id varchar(36) NOT NULL,
      event varchar(256) NOT NULL,  
      target varchar(2048) NOT NULL,  
      criteria json,
      PRIMARY KEY (id)  
    )`
  );

const showClientPromise = ({ pool, table, ...options }) => ({
  // we use the pool as the client because we don't need transactions here,
  // we execute single queries
  clientPromise: C.thenTap(init(table), pool || getPool(options)),
  ...options
});

const add = ({ clientPromise, table }) => async ({
  event,
  target,
  criteria = null
}) =>
  (await clientPromise).query({
    text: `INSERT INTO ${table}(id, event, target, criteria)
    VALUES($1, $2, $3, $4)`,
    values: [uuid(), event, target, criteria]
  });

const remove = ({ clientPromise, table }) => async id =>
  (await clientPromise).query({
    text: `DELETE FROM ${table} WHERE id = $1`,
    values: [id]
  });

const release = (cursor, connection) =>
  cursor.close(() => {
    connection.release();
  });

const buildQuery = table =>
  C.compose(
    ([fields, values]) => ({
      text: `SELECT id, event, target, criteria
        FROM ${table} WHERE ${C.join(
        " AND ",
        C.addIndex(C.map)((field, index) => `${field} = $${index + 1}`, fields)
      )}`,
      values
    }),
    C.transpose,
    C.toPairs,
    // prevent getting the whole table
    C.when(
      C.either(C.isNil, C.isEmpty),
      C.eventuallyThrow("query filter condition is missing")
    )
  );

const getReader = (clientPromise, chunkSize) => async ({ text, values }) => {
  const connection = await (await clientPromise).connect();
  const cursor = connection.query(new Cursor(text, values));
  return () =>
    new Promise((resolve, reject) =>
      cursor.read(chunkSize, (err, chunk) =>
        err
          ? C.tap(() => release(cursor, connection), reject(err))
          : resolve(
              C.tap(
                C.when(C.complement(C.length), () =>
                  release(cursor, connection)
                ),
                chunk
              )
            )
      )
    );
};

const query = ({ clientPromise, table, chunkSize }) =>
  C.compose(
    getReader(clientPromise, chunkSize),
    buildQuery(table)
  );

const end = ({ clientPromise }) => async () => (await clientPromise).end();

export default C.compose(
  C.applySpec({
    add,
    remove,
    query,
    end
  }),
  C.defaultProp("table", "event_subscriptions"),
  C.defaultProp("chunkSize", 1000),
  showClientPromise
);
