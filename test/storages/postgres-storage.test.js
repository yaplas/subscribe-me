import { createPostgresStorage } from "../../src";

describe("createMemoryStorage", () => {
  test("the init query is executed", async () => {
    const query = jest.fn();
    await createPostgresStorage({
      // you can pass the client directly
      // this is useful to test
      client: { query }
    });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
  });
  test("I can add an item", async () => {
    const query = jest.fn();
    const storage = await createPostgresStorage({ client: { query } });
    await storage.add({
      event: "test-event",
      target: "test-target"
    });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("INSERT INTO"),
        values: [expect.any(String), "test-event", "test-target", null]
      })
    );
  });
  test("I can remove an item", async () => {
    const query = jest.fn();
    const storage = await createPostgresStorage({ client: { query } });
    await storage.remove("test-id");
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("DELETE FROM"),
        values: ["test-id"]
      })
    );
  });
  test("I can filter by item fields", async () => {
    const query = jest.fn();
    const storage = await createPostgresStorage({
      client: { query: async (...args) => [query(...args), { rows: [] }][1] }
    });
    await storage.query({ event: "test-event" });
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("SELECT"),
        values: ["test-event"]
      })
    );
  });
});
