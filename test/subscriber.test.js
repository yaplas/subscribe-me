import { createMemoryStorage, createSubscriber } from "../src";

describe("subscriber", () => {
  const storage = createMemoryStorage();
  const subscriber = createSubscriber({ storage });
  let id;
  test("I can subscribe me to an event", done => {
    id = subscriber.subscribe({
      event: "test-event",
      target: "test-target",
      criteria: { test: "test" }
    });
    const next = jest.fn();
    storage
      .query()
      .concatMap()
      .subscribe({
        next,
        complete: () => {
          expect(next).toHaveBeenCalledTimes(1);
          expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
              id: expect.any(String),
              event: "test-event",
              target: "test-target",
              criteria: { test: "test" }
            })
          );
          done();
        }
      });
  });
  test("I can unsubscribe me from the event", done => {
    subscriber.unsubscribe(id);
    const next = jest.fn();
    storage
      .query()
      .concatMap()
      .subscribe({
        next,
        complete: () => {
          expect(next).toHaveBeenCalledTimes(0);
          done();
        }
      });
  });
  test("I should provide the event I want to subscribe to", () => {
    expect(() => {
      subscriber.subscribe({
        target: "test-target",
        criteria: { test: "test" }
      });
    }).toThrow();
  });
  test("I should provide the target I want to be notidied", () => {
    expect(() => {
      subscriber.subscribe({
        event: "test-event",
        criteria: { test: "test" }
      });
    }).toThrow();
  });
});
