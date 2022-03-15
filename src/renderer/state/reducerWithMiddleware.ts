import React, { Dispatch, Reducer, ReducerAction, ReducerState } from 'react';

export default function useReducerWithMiddleware<
  R extends Reducer<any, any>,
  I
>(
  reducer: R,
  initialState: I & ReducerState<R>,
  middlewareFns: ((action: ReducerAction<R>, state: ReducerState<R>) => void)[],
  afterwareFns: ((
    dispatch: ReducerAction<R> | undefined,
    state: ReducerState<R>
  ) => void)[]
): [ReducerState<R>, Dispatch<ReducerAction<R>>] {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const aRef = React.useRef();

  const dispatchWithMiddleware = (action: ReducerAction<R>) => {
    middlewareFns.forEach((middlewareFn) => middlewareFn(action, state));

    aRef.current = action;

    dispatch(action);
  };

  React.useEffect(() => {
    if (!aRef.current) return;

    afterwareFns.forEach((afterwareFn) => afterwareFn(aRef.current, state));

    aRef.current = undefined;
  }, [afterwareFns, state]);

  return [state, dispatchWithMiddleware];
}
