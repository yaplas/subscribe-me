import {
  compose,
  isNil,
  prop,
  when,
  is,
  both,
  not,
  flip,
  any,
  applyTo,
  curry,
  over,
  lensProp,
  defaultTo
} from "ramda";

export * from "ramda";

export const throwError = err => {
  throw err;
};

export const eventuallyThrow = err => () => throwError(err);

export const mandatoryProp = (name, err) =>
  when(
    compose(
      isNil,
      prop(name)
    ),
    eventuallyThrow(err)
  );

export const defaultProp = (name, value) =>
  over(lensProp(name), defaultTo(value));

export const isObject = both(
  is(Object),
  compose(
    not,
    flip(any)([is(Array), is(Date), is(Function)]),
    applyTo
  )
);

export const thenTap = curry(
  async (func, value) => [await func(value), value][1]
);
