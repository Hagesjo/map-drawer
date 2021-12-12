export default interface SocketEvents {
    "hello world": (payload: string, cb: (n: number) => void) => void;
}
