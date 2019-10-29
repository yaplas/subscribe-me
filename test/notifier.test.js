import { from } from "rxjs";
import {
  createPostgresStorage,
  createMemoryStorage,
  createSubscriber,
  createNotifier
} from "../src";
import * as C from "../src/modules/composition";

describe("notifier", () => {
  const storage = createMemoryStorage();
  const subscriber = createSubscriber({ storage });
  const notifier = createNotifier({ storage });
  const events = from([
    { type: "some-thing-that-eventually-happen", payload: { thing: "test" } },
    { type: "value-change", payload: { previous: 4, current: 3 } },
    { type: "value-change", payload: { previous: 3, current: 5 } }
  ]);

  test("I can be notifiead whenever an event occur", done => {
    const id = subscriber.subscribe({
      event: "some-thing-that-eventually-happen",
      target: "test-target"
    });
    const next = jest.fn();
    notifier.getNotifications(events).subscribe({
      next,
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            id,
            type: "some-thing-that-eventually-happen",
            target: "test-target",
            payload: { thing: "test" }
          })
        );
        subscriber.unsubscribe(id);
        done();
      }
    });
  });
  test("I can be notified only if payload satisfy certain criteria", done => {
    const id = subscriber.subscribe({
      event: "value-change",
      target: "test-target",
      criteria: {
        previous: { $gte: 4 },
        current: { $lt: 4 }
      }
    });
    const next = jest.fn();
    notifier.getNotifications(events).subscribe({
      next,
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            id,
            type: "value-change",
            target: "test-target",
            payload: { previous: 4, current: 3 }
          })
        );
        subscriber.unsubscribe(id);
        done();
      }
    });
  });
  test("The subscription criteria could compare payload fields with each other", done => {
    const id = subscriber.subscribe({
      event: "value-change",
      target: "test-target",
      criteria: { $expr: { $gt: ["$current", "$previous"] } }
    });
    const next = jest.fn();
    notifier.getNotifications(events).subscribe({
      next,
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            id,
            type: "value-change",
            target: "test-target",
            payload: { previous: 3, current: 5 }
          })
        );
        subscriber.unsubscribe(id);
        done();
      }
    });
  });
  test("I can be notified taking the subscription from a cursor like reader", done => {
    const rows1 = [
      { id: "id-1", event: "test-event", target: "one" },
      { id: "id-2", event: "test-event", target: "two" }
    ];
    const rows2 = [
      { id: "id-3", event: "test-event", target: "three" },
      { id: "id-4", event: "test-event", target: "four" }
    ];
    const read = jest
      .fn()
      // for first event
      .mockImplementationOnce((size, callback) => callback(undefined, rows1))
      .mockImplementationOnce((size, callback) => callback(undefined, rows2))
      .mockImplementationOnce((size, callback) => callback(undefined, []))
      // for second event
      .mockImplementationOnce((size, callback) => callback(undefined, rows1))
      .mockImplementationOnce((size, callback) => callback(undefined, rows2))
      .mockImplementationOnce((size, callback) => callback(undefined, []));

    const close = jest.fn(callback => callback());
    const query = jest.fn(() => ({ read, close }));
    const release = jest.fn();
    const connect = jest.fn(() => ({ query, release }));
    const createTable = jest.fn();
    const storageMock = createPostgresStorage({
      pool: { connect, query: createTable }
    });
    const next = jest.fn();
    const inputEvents = [
      { type: "test-event", payload: { test: 1 } },
      { type: "test-event", payload: { test: 2 } }
    ];
    createNotifier({ storage: storageMock })
      .getNotifications(from(inputEvents))
      .subscribe({
        next,
        complete: () => {
          expect(next).toHaveBeenCalledTimes(8);
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[0], C.pick(["id", "target"], rows1[0]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[0], C.pick(["id", "target"], rows1[1]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[0], C.pick(["id", "target"], rows2[0]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[0], C.pick(["id", "target"], rows2[1]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[1], C.pick(["id", "target"], rows1[0]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[1], C.pick(["id", "target"], rows1[1]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[1], C.pick(["id", "target"], rows2[0]))
          );
          expect(next).toHaveBeenCalledWith(
            C.merge(inputEvents[1], C.pick(["id", "target"], rows2[1]))
          );
          expect(createTable).toHaveBeenCalledTimes(1);
          expect(query).toHaveBeenCalledTimes(1);
          expect(read).toHaveBeenCalledTimes(3);
          expect(close).toHaveBeenCalledTimes(1);
          expect(release).toHaveBeenCalledTimes(1);
          done();
        }
      });
  });
});
