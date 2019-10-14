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
  applyTo
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

export const isObject = both(
  is(Object),
  compose(
    not,
    flip(any)([is(Array), is(Date), is(Function)]),
    applyTo
  )
);
