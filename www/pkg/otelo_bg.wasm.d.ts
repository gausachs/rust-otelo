/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const __wbg_game_free: (a: number, b: number) => void;
export const game_ai_move: (a: number) => [number, number, number];
export const game_apply_human_move: (a: number, b: number) => [number, number];
export const game_board_cells: (a: number) => [number, number];
export const game_eval_for_human: (a: number) => number;
export const game_is_game_over: (a: number) => number;
export const game_last_flips: (a: number) => [number, number];
export const game_last_move_idx: (a: number) => number;
export const game_last_move_player: (a: number) => number;
export const game_legal_move_evals: (a: number) => [number, number];
export const game_legal_moves: (a: number) => [number, number];
export const game_new: (a: number, b: number) => [number, number, number];
export const game_pass: (a: number) => [number, number];
export const game_reset: (a: number, b: number) => [number, number];
export const game_score_black: (a: number) => number;
export const game_score_white: (a: number) => number;
export const game_set_depth: (a: number, b: number) => void;
export const game_set_human_color: (a: number, b: number) => [number, number];
export const game_side_to_move: (a: number) => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;
