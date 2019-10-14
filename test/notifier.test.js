import { from } from "rxjs";
import { createMemoryStorage, createSubscriber, createNotifier } from "../src";

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
            event: "some-thing-that-eventually-happen",
            target: "test-target",
            payload: { thing: "test" }
          })
        );
        subscriber.unsubscribe(id);
        done();
      }
    });
  });
  test("I can be notifiead only if payload satisfy certain criteria", done => {
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
            event: "value-change",
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
            event: "value-change",
            target: "test-target",
            payload: { previous: 3, current: 5 }
          })
        );
        subscriber.unsubscribe(id);
        done();
      }
    });
  });
});
