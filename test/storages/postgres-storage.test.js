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
    const storage = await createPostgresStorage({ pool: { query } });
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
  test("I can filter by item fields", done => {
    const read = jest
      .fn()
      .mockImplementationOnce((size, callback) =>
        callback(undefined, [
          { event: "test-event", target: "one" },
          { event: "test-event", target: "two" }
        ])
      )
      .mockImplementationOnce((size, callback) => callback(undefined, []));
    const close = jest.fn(callback => callback());
    const release = jest.fn();
    const query = jest.fn(() => ({ read, close }));
    const connect = jest.fn(() => ({ query, release }));
    const createTable = jest.fn();
    const end = jest.fn();
    const chunkMapper = jest.fn(x => x);
    const next = jest.fn();
    const storage = createPostgresStorage({
      pool: { connect, query: createTable, end }
    });
    storage
      .query({ event: "test-event" })
      .concatMap(chunkMapper)
      .subscribe({
        next,
        complete: () => {
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
          expect(chunkMapper).toHaveBeenCalledTimes(1);
          expect(next).toHaveBeenCalledTimes(2); // two items into the chunk emited by the cursor
          storage.end().then(() => {
            expect(end).toHaveBeenCalledTimes(1);
            done();
          });
        }
      });
  });
  test("when query fails it throw", done => {
    const read = jest.fn((size, callback) => callback("testing errors"));
    const close = jest.fn(callback => callback());
    const release = jest.fn();
    const query = jest.fn(() => ({ read, close }));
    const connect = jest.fn(() => ({ query, release }));
    const createTable = jest.fn();
    const storage = createPostgresStorage({
      pool: { connect, query: createTable }
    });
    storage
      .query({ event: "test-event" })
      .concatMap()
      .subscribe({
        error: err => {
          expect(err).toEqual("testing errors");
          done();
        }
      });
  });
});
