import { createMemoryStorage, createSubscriber } from "../src";

describe("subscriber", () => {
  const storage = createMemoryStorage();
  const subscriber = createSubscriber({ storage });
  let id;
  test("I can subscribe me to an event", () => {
    id = subscriber.subscribe({
      event: "test-event",
      target: "test-target",
      criteria: { test: "test" }
    });
    expect(storage.query()).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        event: "test-event",
        target: "test-target",
        criteria: { test: "test" }
      })
    ]);
  });
  test("I can unsubscribe me from the event", () => {
    subscriber.unsubscribe(id);
    expect(storage.query()).toEqual([]);
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
