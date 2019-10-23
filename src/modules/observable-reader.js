import { BehaviorSubject, asapScheduler, defer, from } from "rxjs";
import { takeWhile, finalize, concatMap } from "rxjs/operators";
import * as C from "./composition";

const setupSubject = (subject, reader, mapper) =>
  defer(() =>
    subject.pipe(
      concatMap(() => from(reader())),
      takeWhile(chunk => chunk && chunk.length),
      concatMap(chunk =>
        finalize(asapScheduler.schedule(() => subject.next()))(
          from(mapper(chunk))
        )
      )
    )
  );

export default (reader, mapper = C.identity) =>
  setupSubject(new BehaviorSubject(), reader, mapper);
