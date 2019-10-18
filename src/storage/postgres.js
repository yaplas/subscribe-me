import { Pool } from "pg";
import Cursor from "pg-cursor";
import uuid from "uuid/v4";
import { BehaviorSubject, from, asapScheduler } from "rxjs";
import { concatMap, takeWhile, map, tap, concatAll } from "rxjs/operators";
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

const cursorReader = cursor => size =>
  new Promise((resolve, reject) =>
    cursor.read(size, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

const release = (cursor, connection) =>
  cursor.close(() => {
    connection.release();
  });

const buildChunkGetter = ({ chunkSize, clientPromise }) =>
  C.compose(
    getterPromise => async () => (await getterPromise)(),
    async ({ text, values }) => {
      const connection = await (await clientPromise).connect();
      const cursor = connection.query(new Cursor(text, values));
      const read = cursorReader(cursor);
      return async () => {
        const rows = await read(chunkSize);
        if (rows.length === 0) {
          release(cursor, connection);
        }
        return rows;
      };
    }
  );

const getConcatenator = getNextChunk => ({
  concatMap: (chunkMapper = C.identity) => {
    const subject = new BehaviorSubject(0).pipe(
      concatMap(() => from(getNextChunk())),
      takeWhile(chunk => chunk.length > 0),
      map(chunkMapper),
      tap(() => asapScheduler.schedule(() => subject.next())),
      concatAll()
    );
    return subject;
  }
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

const query = ({ clientPromise, table, chunkSize }) =>
  C.compose(
    getConcatenator,
    buildChunkGetter({ chunkSize, clientPromise }),
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
