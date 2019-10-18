import { concatMap, filter } from "rxjs/operators";
import { Query } from "mingo";
import * as C from "./composition";

const testCriteria = payload => criteria =>
  payload && new Query(criteria).test(payload);

const isEventWellFormed = C.both(
  // type should be a non empty string
  C.compose(
    C.both(C.is(String), C.complement(C.isEmpty)),
    C.prop("type")
  ),
  // if there is payload it should be an object
  // string, arrays, dates, numbers, functions... are not allowed
  C.compose(
    C.either(C.isNil, C.isObject),
    C.prop("payload")
  )
);

const subscriptionsChunkMapper = event =>
  C.compose(
    C.map(
      C.compose(
        C.merge(event),
        C.pick(["id", "event", "target"])
      )
    ),
    C.filter(
      C.compose(
        C.either(C.isNil, testCriteria(event.payload)),
        C.prop("criteria")
      )
    )
  );

const getNotifications = ({ storage }) => events =>
  events.pipe(
    // skip bad formed events
    // TODO: log this discarded event in somewhere
    filter(isEventWellFormed),
    // convert events stream to notifications stream
    concatMap(event =>
      storage
        .query({ event: event.type })
        .concatMap(subscriptionsChunkMapper(event))
    )
  );

export default C.compose(
  C.applySpec({
    getNotifications
  }),
  C.mandatoryProp("storage", new Error("No storage provided"))
);
