import { createMemoryStorage } from "../../src";

describe("createMemoryStorage", () => {
  const storage = createMemoryStorage();
  let id;
  test("I can add an item", done => {
    id = storage.add({ testField: "test-value" });
    const next = jest.fn();
    storage.query().subscribe({
      next,
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            testField: "test-value"
          })
        );
        done();
      }
    });
  });
  test("I can remove the item", done => {
    storage.remove(id);
    const next = jest.fn();
    storage.query().subscribe({
      next,
      complete: () => {
        expect(next).not.toHaveBeenCalled();
        done();
      }
    });
  });
  test("I can filter by item fields", done => {
    storage.add({ testField: "another-value" });
    const next = jest.fn();
    storage.query({ testField: "another-value" }).subscribe({
      next,
      complete: () => {
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.any(String),
            testField: "another-value"
          })
        );
        done();
      }
    });
  });
});
