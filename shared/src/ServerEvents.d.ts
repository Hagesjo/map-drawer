import type { Diff } from "deep-diff";
import type { SharedState } from "./SharedState";

export interface ServerEvents {
    "hello world": (payload: string, cb: (n: number) => void) => void;
    initState: (state: SharedState) => void;
    updateState: (diffs: Diff<SharedState, SharedState>[]) => void;
}
