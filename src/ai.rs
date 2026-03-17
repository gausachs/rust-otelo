use crate::bitboard::Color;
use crate::board::{Board, EvalParams, DEFAULT_EVAL_PARAMS};
use rand::seq::SliceRandom;
use rand::thread_rng;
use std::collections::HashMap;

#[allow(dead_code)]
pub fn best_move_minimax(board: Board, player: Color, depth: i32) -> (u64, i32) {
    best_move_minimax_with_params(board, player, depth, DEFAULT_EVAL_PARAMS)
}

#[allow(dead_code)]
pub fn best_move_minimax_with_params(
    board: Board,
    player: Color,
    depth: i32,
    params: EvalParams,
) -> (u64, i32) {
    let mut tt: HashMap<u128, (i32, i32)> = HashMap::new(); // key -> (depth, score)
    let legal = board.legal_moves(player);
    if legal == 0 {
        let mut b = board;
        b.apply_move(0).ok();
        let score = minimax(b, player, depth - 1, -1_000_000, 1_000_000, params, &mut tt);
        return (0, score);
    }

    let mut best_score = -1_000_000;
    let mut best_moves: Vec<u64> = Vec::new();
    let moves = ordered_moves(board, player, params, true);
    for mv in moves {
        let mut b = board;
        b.apply_move(mv).ok();
        let score = minimax(b, player, depth - 1, -1_000_000, 1_000_000, params, &mut tt);
        if score > best_score {
            best_score = score;
            best_moves.clear();
            best_moves.push(mv);
        } else if score == best_score {
            best_moves.push(mv);
        }
    }
    let mut rng = thread_rng();
    let choice = best_moves.choose(&mut rng).copied().unwrap_or(0);
    (choice, best_score)
}

#[allow(dead_code)]
pub fn best_move_iterative_with_params(
    board: Board,
    player: Color,
    depth: i32,
    params: EvalParams,
) -> (u64, i32) {
    let mut best_move = 0u64;
    let mut best_score = -1_000_000;
    let max_depth = depth.max(1);
    for d in 1..=max_depth {
        let (mv, score) = best_move_minimax_with_params(board, player, d, params);
        if mv != 0 {
            best_move = mv;
            best_score = score;
        }
    }
    (best_move, best_score)
}

fn minimax(
    board: Board,
    player: Color,
    depth: i32,
    mut alpha: i32,
    mut beta: i32,
    params: EvalParams,
    tt: &mut HashMap<u128, (i32, i32)>,
) -> i32 {
    let key = board.hash();
    if let Some((stored_depth, stored_score)) = tt.get(&key) {
        if *stored_depth >= depth {
            return *stored_score;
        }
    }
    if depth <= 0 || (!board.has_legal_move(Color::Black) && !board.has_legal_move(Color::White))
    {
        let score = board.evaluate_for_depth_with(player, depth.max(0), params);
        tt.insert(key, (depth, score));
        return score;
    }

    if board.side_to_move == player {
        let legal = board.legal_moves(player);
        if legal == 0 {
            let mut b = board;
            b.apply_move(0).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params, tt);
            tt.insert(key, (depth, score));
            return score;
        }
        let mut best = -1_000_000;
        let moves = ordered_moves(board, player, params, true);
        for mv in moves {
            let mut b = board;
            b.apply_move(mv).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params, tt);
            if score > best {
                best = score;
            }
            if best > alpha {
                alpha = best;
            }
            if beta <= alpha {
                break;
            }
        }
        tt.insert(key, (depth, best));
        best
    } else {
        let legal = board.legal_moves(player.opponent());
        if legal == 0 {
            let mut b = board;
            b.apply_move(0).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params, tt);
            tt.insert(key, (depth, score));
            return score;
        }
        let mut best = 1_000_000;
        let moves = ordered_moves(board, player.opponent(), params, false);
        for mv in moves {
            let mut b = board;
            b.apply_move(mv).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params, tt);
            if score < best {
                best = score;
            }
            if best < beta {
                beta = best;
            }
            if beta <= alpha {
                break;
            }
        }
        tt.insert(key, (depth, best));
        best
    }
}

fn ordered_moves(board: Board, player: Color, params: EvalParams, maximizing: bool) -> Vec<u64> {
    let legal = board.legal_moves(player);
    let mut moves = Vec::new();
    let mut bb = legal;
    while bb != 0 {
        let mv = bb & (!bb + 1);
        bb &= bb - 1;
        let mut b = board;
        b.apply_move(mv).ok();
        // Fast static eval for ordering.
        let score = b.evaluate_for_depth_with(player, 0, params);
        moves.push((mv, score));
    }
    if maximizing {
        moves.sort_by(|a, b| b.1.cmp(&a.1));
    } else {
        moves.sort_by(|a, b| a.1.cmp(&b.1));
    }
    moves.into_iter().map(|m| m.0).collect()
}
