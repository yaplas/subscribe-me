import { createPostgresStorage } from "../../src";

describe("createPostgresStorage", () => {
  test("the init query is executed", async () => {
    const query = jest.fn();
    const storage = createPostgresStorage({
      // you can pass the client directly
      // this is useful to test
      pool: { query }
    });
    await storage.client;
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
  });
  test("I can add an item", async () => {
    const query = jest.fn();
    const storage = createPostgresStorage({ pool: { query } });
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
    const storage = createPostgresStorage({ pool: { query } });
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
  test("I can terminate the storage", async () => {
    const end = jest.fn();
    const connect = jest.fn();
    const query = jest.fn();
    const storage = createPostgresStorage({
      pool: { connect, query, end }
    });
    await storage.end();
    expect(end).toHaveBeenCalledTimes(1);
    expect(connect).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
  });
  test("I can filter by item fields", async () => {
    const rows = [
      { event: "test-event", target: "one" },
      { event: "test-event", target: "two" }
    ];
    const read = jest
      .fn()
      .mockImplementationOnce((size, callback) => callback(undefined, rows))
      .mockImplementationOnce((size, callback) => callback(undefined, []));
    const release = jest.fn();
    const close = jest.fn(callback => callback());
    const query = jest.fn(() => ({ read, close }));
    const connect = jest.fn(async () => ({ query, release }));
    const createTable = jest.fn();
    const end = jest.fn();
    const storage = createPostgresStorage({
      pool: { connect, query: createTable, end }
    });
    const reader = await storage.query({ event: "test-event" });
    const data = await reader();
    expect(data).toEqual(rows);
    const emptyChunk = await reader();
    expect(emptyChunk).toEqual([]);
    expect(createTable).toHaveBeenCalledTimes(1);
    expect(createTable).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("SELECT"),
        values: ["test-event"]
      })
    );
    expect(read).toHaveBeenCalledTimes(2);
    expect(read).toHaveBeenCalledWith(1000, expect.any(Function));
    expect(close).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });
  test("throw when query fails", async () => {
    const read = jest.fn((size, callback) =>
      callback(new Error("wrong query"), [])
    );
    const release = jest.fn();
    const close = jest.fn(callback => callback());
    const query = jest.fn(() => ({ read, close }));
    const connect = jest.fn(async () => ({ query, release }));
    const createTable = jest.fn();
    const storage = createPostgresStorage({
      pool: { connect, query: createTable }
    });
    const reader = await storage.query({ something: "test-event" });
    await expect(reader()).rejects.toThrow("wrong query");
    expect(createTable).toHaveBeenCalledTimes(1);
    expect(createTable).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS")
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("SELECT"),
        values: ["test-event"]
      })
    );
    expect(read).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledWith(1000, expect.any(Function));
    expect(close).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });
  test("throw when service is unreachable", async () => {
    const storage = createPostgresStorage({
      host: "any-non-reachable-host",
      database: "any-unreachable-database"
    });
    expect(storage.query({ something: "test-event" })).rejects.toThrow();
  });
});
