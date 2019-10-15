import { Pool } from "pg";
import uuid from "uuid/v4";
import { from } from "rxjs";
import { switchMap } from "rxjs/operators";
import * as C from "../modules/composition";

const getPool = options => (options ? new Pool(options) : new Pool());

const init = client =>
  client.query(
    `CREATE TABLE IF NOT EXISTS event_subscriptions(
      id varchar(36) NOT NULL,
      event varchar(256) NOT NULL,  
      target varchar(2048) NOT NULL,  
      criteria json,
      PRIMARY KEY (id)  
    )`
  );

const showClient = ({ client, ...options }) => ({
  // we use the pool as the client because we don't need transactions here,
  // we execute single queries
  client: C.thenTap(init, client || getPool(options)),
  ...options
});

const add = ({ client }) => async ({ event, target, criteria = null }) =>
  (await client).query({
    text: `INSERT INTO event_subscriptions(id, event, target, criteria)
    VALUES($1, $2, $3, $4)`,
    values: [uuid(), event, target, criteria]
  });

const remove = ({ client }) => async id =>
  (await client).query({
    text: `DELETE FROM event_subscriptions WHERE id = $1`,
    values: [id]
  });

// TODO: try using a cursor or memoizing
const getQueryData = async (queryObj, client) =>
  (await (await client).query(queryObj)).rows;

const getObservable = (client, queryObj) =>
  from(getQueryData(queryObj, client)).pipe(switchMap(rows => from(rows)));

const query = ({ client }) =>
  C.compose(
    ([fields, values]) =>
      getObservable(client, {
        text: `SELECT id, event, target, criteria
        FROM event_subscriptions WHERE ${C.join(
          " AND ",
          C.addIndex(C.map)(
            (field, index) => `${field} = $${index + 1}`,
            fields
          )
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

export default C.compose(
  C.applySpec({
    add,
    remove,
    query
  }),
  showClient
);
