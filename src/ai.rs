use crate::bitboard::Color;
use crate::board::{Board, EvalParams, DEFAULT_EVAL_PARAMS};

pub fn best_move_minimax(board: Board, player: Color, depth: i32) -> (u64, i32) {
    best_move_minimax_with_params(board, player, depth, DEFAULT_EVAL_PARAMS)
}

pub fn best_move_minimax_with_params(
    board: Board,
    player: Color,
    depth: i32,
    params: EvalParams,
) -> (u64, i32) {
    let legal = board.legal_moves(player);
    if legal == 0 {
        let mut b = board;
        b.apply_move(0).ok();
        let score = minimax(b, player, depth - 1, -1_000_000, 1_000_000, params);
        return (0, score);
    }

    let mut best_move = 0u64;
    let mut best_score = -1_000_000;
    let mut moves = legal;
    while moves != 0 {
        let mv = moves & (!moves + 1);
        moves &= moves - 1;
        let mut b = board;
        b.apply_move(mv).ok();
        let score = minimax(b, player, depth - 1, -1_000_000, 1_000_000, params);
        if score > best_score {
            best_score = score;
            best_move = mv;
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
) -> i32 {
    if depth <= 0 || (!board.has_legal_move(Color::Black) && !board.has_legal_move(Color::White))
    {
        return board.evaluate_for_depth_with(player, depth.max(0), params);
    }

    if board.side_to_move == player {
        let legal = board.legal_moves(player);
        if legal == 0 {
            let mut b = board;
            b.apply_move(0).ok();
            return minimax(b, player, depth - 1, alpha, beta, params);
        }
        let mut moves = legal;
        let mut best = -1_000_000;
        while moves != 0 {
            let mv = moves & (!moves + 1);
            moves &= moves - 1;
            let mut b = board;
            b.apply_move(mv).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params);
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
        best
    } else {
        let legal = board.legal_moves(player.opponent());
        if legal == 0 {
            let mut b = board;
            b.apply_move(0).ok();
            return minimax(b, player, depth - 1, alpha, beta, params);
        }
        let mut moves = legal;
        let mut best = 1_000_000;
        while moves != 0 {
            let mv = moves & (!moves + 1);
            moves &= moves - 1;
            let mut b = board;
            b.apply_move(mv).ok();
            let score = minimax(b, player, depth - 1, alpha, beta, params);
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
        best
    }
}
