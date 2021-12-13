type AddSocketArg<S, F extends (...args: any) => void> = F extends (
    ...args: infer Args
) => void
    ? (socket: S, ...args: Args) => void
    : never;

type WithSockets<S, I extends Record<keyof I, (...args: any) => void>> = {
    [index in keyof I]: AddSocketArg<S, I[index]>;
};

export default WithSockets;
