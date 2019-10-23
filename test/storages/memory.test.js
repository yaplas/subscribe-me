import { createMemoryStorage } from "../../src";

describe("createMemoryStorage", () => {
  const storage = createMemoryStorage();
  let id;
  test("I can add an item", () => {
    id = storage.add({ testField: "test-value" });
    expect(storage.query()).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        testField: "test-value"
      })
    ]);
  });
  test("I can remove the item", () => {
    storage.remove(id);
    expect(storage.query()).toEqual([]);
  });
  test("I can filter by item fields", () => {
    storage.add({ testField: "another-value" });
    expect(storage.query({ testField: "another-value" })).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        testField: "another-value"
      })
    ]);
    expect(storage.query({ testField: "not-exists" })).toEqual([]);
  });
});
