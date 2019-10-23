import uuid from "uuid/v4";
import * as C from "../modules/composition";

let items = [];

const add = C.compose(
  C.prop("id"),
  C.tap(data => {
    items = [...items, data];
  }),
  C.merge({ id: uuid() })
);

const remove = id => {
  items = C.filter(item => item.id !== id, items);
};

const query = where => (where ? C.filter(C.whereEq(where), items) : items);

export default () => ({
  add,
  remove,
  query
});
