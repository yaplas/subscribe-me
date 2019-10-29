import { from, merge } from "rxjs";
import { concatMap, filter, bufferTime } from "rxjs/operators";
import { Query } from "mingo";
import * as C from "./composition";
import createObservableReader from "./observable-reader";

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

const mapEventsToSubscriptions = events => subscriptions =>
  C.chain(
    event =>
      C.compose(
        C.map(
          C.compose(
            C.merge(event),
            C.pick(["id", "target"])
          )
        ),
        C.filter(
          C.compose(
            C.either(C.isNil, testCriteria(event.payload)),
            C.prop("criteria")
          )
        )
      )(subscriptions),
    events
  );

const resolveQueryData = mapper => data =>
  C.is(Function, data)
    ? createObservableReader(data, mapper)
    : from(mapper(data));

const resolveQueryPromise = (result, mapper) =>
  C.is(Promise, result)
    ? from(result).pipe(concatMap(resolveQueryData(mapper)))
    : resolveQueryData(mapper)(result);

const getNotifications = ({ storage, bufferMilliseconds = 0 }) => events =>
  events.pipe(
    // skip bad formed events
    // TODO: log this discarded event in somewhere
    filter(isEventWellFormed),
    // build an event buffer to minimize storage accesses
    bufferTime(bufferMilliseconds),
    // convert events stream to notifications stream
    concatMap(
      C.compose(
        C.apply(merge),
        C.map(([type, typeEvents]) =>
          resolveQueryPromise(
            storage.query({ event: type }),
            mapEventsToSubscriptions(typeEvents)
          )
        ),
        C.toPairs,
        C.groupBy(C.prop("type"))
      )
    )
  );

export default C.compose(
  C.applySpec({
    getNotifications
  }),
  C.mandatoryProp("storage", new Error("No storage provided"))
);
