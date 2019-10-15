import { createPostgresStorage } from "../../src";

describe("createPostgresStorage", () => {
  test("the init query is executed", async () => {
    const query = jest.fn();
    const storage = createPostgresStorage({
      // you can pass the client directly
      // this is useful to test
      client: { query }
    });
    await storage.client;
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
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("INSERT INTO"),
        values: [expect.any(String), "test-event", "test-target", null]
      })
    );
  });
  test("I can remove an item", async () => {
    const query = jest.fn();
    const storage = createPostgresStorage({ client: { query } });
    await storage.remove("test-id");
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("DELETE FROM"),
        values: ["test-id"]
      })
    );
  });
  test("I can filter by item fields", done => {
    const query = jest.fn(() => ({ rows: [] }));
    const storage = createPostgresStorage({ client: { query } });
    storage.query({ event: "test-event" }).subscribe({
      next: () => {},
      complete: () => {
        expect(query).toHaveBeenCalledTimes(2);
        expect(query).toHaveBeenCalledWith(
          expect.stringContaining("CREATE TABLE IF NOT EXISTS")
        );
        expect(query).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining("SELECT"),
            values: ["test-event"]
          })
        );
        done();
      }
    });
  });
});
