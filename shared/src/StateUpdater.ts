import type { Diff } from "deep-diff";
import deepDiff from "deep-diff";
import rfdc from "rfdc";
import type { DeepReadonly } from "ts-essentials";
const deepClone = rfdc();

export class StateUpdater<T> {
    private current: T;
    protected next: T;
    private clone?: DeepReadonly<T>;

    constructor(initialState: T) {
        this.current = deepClone(initialState);
        this.next = deepClone(this.current);
    }

    setState(state: T) {
        this.next = state;
    }

    state() {
        if (this.clone === undefined)
            this.clone = deepClone(this.current) as DeepReadonly<T>;
        return this.clone;
    }

    apply(diffs: Diff<T, T>[]) {
        diffs.forEach((diff) =>
            deepDiff.applyChange(this.next, undefined, diff)
        );
    }

    update() {
        const diffs = deepDiff.diff(this.current, this.next);
        if (diffs !== undefined && diffs.length > 0) {
            this.sync();
        }
        return diffs;
    }

    sync() {
        this.clone = undefined;
        this.current = this.next;
        this.next = deepClone(this.current);
    }
}
