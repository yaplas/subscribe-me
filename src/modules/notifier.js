import { concatMap, filter, map } from "rxjs/operators";
import { Query } from "mingo";
import * as C from "./composition";

const testCriteria = payload => criteria => new Query(criteria).test(payload);

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

const getNotifications = ({ storage }) => events =>
  events.pipe(
    // skip bad formed events
    filter(isEventWellFormed),
    // convert events stream to notifications stream
    concatMap(({ type, payload }) =>
      storage.query({ event: type }).pipe(
        filter(
          C.compose(
            C.either(C.isNil, testCriteria(payload)),
            C.prop("criteria")
          )
        ),
        map(
          C.compose(
            C.merge({ payload }),
            C.pick(["id", "event", "target"])
          )
        )
      )
    )
  );

const getNotifier = C.applySpec({
  getNotifications
});

export default C.compose(
  getNotifier,
  C.mandatoryProp("storage", new Error("No storage provided"))
);
