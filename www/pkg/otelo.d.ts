/* tslint:disable */
/* eslint-disable */

export class Game {
    free(): void;
    [Symbol.dispose](): void;
    ai_move(): number;
    apply_human_move(idx: number): void;
    board_cells(): Uint8Array;
    eval_for_human(): number;
    is_game_over(): boolean;
    last_flips(): Uint32Array;
    last_move_idx(): number;
    last_move_player(): number;
    legal_move_evals(): Int32Array;
    legal_moves(): Uint8Array;
    material_eval_for_human(): number;
    constructor(human_color: number, depth: number);
    pass(): void;
    reset(human_color: number): void;
    score_black(): number;
    score_white(): number;
    set_depth(depth: number): void;
    set_human_color(human_color: number): void;
    side_to_move(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_game_free: (a: number, b: number) => void;
    readonly game_ai_move: (a: number) => [number, number, number];
    readonly game_apply_human_move: (a: number, b: number) => [number, number];
    readonly game_board_cells: (a: number) => [number, number];
    readonly game_eval_for_human: (a: number) => number;
    readonly game_is_game_over: (a: number) => number;
    readonly game_last_flips: (a: number) => [number, number];
    readonly game_last_move_idx: (a: number) => number;
    readonly game_last_move_player: (a: number) => number;
    readonly game_legal_move_evals: (a: number) => [number, number];
    readonly game_legal_moves: (a: number) => [number, number];
    readonly game_material_eval_for_human: (a: number) => number;
    readonly game_new: (a: number, b: number) => [number, number, number];
    readonly game_pass: (a: number) => [number, number];
    readonly game_reset: (a: number, b: number) => [number, number];
    readonly game_score_black: (a: number) => number;
    readonly game_score_white: (a: number) => number;
    readonly game_set_depth: (a: number, b: number) => void;
    readonly game_set_human_color: (a: number, b: number) => [number, number];
    readonly game_side_to_move: (a: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
