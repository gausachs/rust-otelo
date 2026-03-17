#[allow(dead_code)]
#[path = "../ai.rs"]
mod ai;
#[allow(dead_code)]
#[path = "../bitboard.rs"]
mod bitboard;
#[allow(dead_code)]
#[path = "../board.rs"]
mod board;

use ai::best_move_minimax_with_params;
use bitboard::Color;
use board::{Board, EvalParams, DEFAULT_EVAL_PARAMS};
use rand::seq::SliceRandom;
use rand::thread_rng;

fn main() {
    let games = arg_i32("--games", 20);
    let depth = arg_i32("--depth", 4);
    let rand_plies = arg_i32("--rand-plies", 4).max(0) as u32;
    if has_flag("--help") || has_flag("-h") {
        print_help();
        return;
    }

    let params_b = EvalParams {
        material_scale: arg_i32("--material", DEFAULT_EVAL_PARAMS.material_scale),
        mobility_scale: arg_i32("--mobility", DEFAULT_EVAL_PARAMS.mobility_scale),
        mobility_penalty_scale: arg_i32("--penalty", DEFAULT_EVAL_PARAMS.mobility_penalty_scale),
        pst_scale: arg_i32("--pst", DEFAULT_EVAL_PARAMS.pst_scale),
    };

    let params_a = DEFAULT_EVAL_PARAMS;

    let mut a_wins = 0;
    let mut b_wins = 0;
    let mut draws = 0;

    for g in 0..games {
        let mut board = Board::new();
        let (black_params, white_params, a_is_black) = if g % 2 == 0 {
            (params_a, params_b, true)
        } else {
            (params_b, params_a, false)
        };

        let mut ply = 0u32;
        while board.has_legal_move(Color::Black) || board.has_legal_move(Color::White) {
            let player = board.side_to_move;
            let params = if player == Color::Black {
                black_params
            } else {
                white_params
            };
            let mv = if ply < rand_plies {
                random_legal_move(board, player).unwrap_or(0)
            } else {
                let (mv, _score) = best_move_minimax_with_params(board, player, depth, params);
                mv
            };
            board.apply_move(mv).unwrap();
            ply += 1;
        }

        let black = board.count(Color::Black);
        let white = board.count(Color::White);
        let black_wins = black > white;
        let white_wins = white > black;
        let a_win = if a_is_black { black_wins } else { white_wins };
        let b_win = if a_is_black { white_wins } else { black_wins };

        if a_win {
            a_wins += 1;
        } else if b_win {
            b_wins += 1;
        } else {
            draws += 1;
        }
    }

    println!("Games: {}", games);
    println!("Depth: {}", depth);
    println!("A (default) wins: {}", a_wins);
    println!("B (custom) wins: {}", b_wins);
    println!("Draws: {}", draws);
}

fn arg_i32(name: &str, default: i32) -> i32 {
    let args: Vec<String> = std::env::args().collect();
    for i in 0..args.len().saturating_sub(1) {
        if args[i] == name {
            if let Ok(v) = args[i + 1].parse::<i32>() {
                return v;
            }
        }
    }
    default
}

fn has_flag(name: &str) -> bool {
    std::env::args().any(|a| a == name)
}

fn print_help() {
    println!("Usage: cargo run --bin sim -- [options]");
    println!();
    println!("Simulation options:");
    println!("  --games N        Number of games (default: 20)");
    println!("  --depth N        Minimax depth (default: 4)");
    println!("  --rand-plies N   Random opening plies (default: 4)");
    println!();
    println!("B (custom) evaluation scales (percent, default: 100):");
    println!("  --material N     Material scale");
    println!("  --mobility N     Mobility scale");
    println!("  --penalty N      Mobility penalty scale");
    println!("  --pst N          PST scale");
}

fn random_legal_move(board: Board, player: Color) -> Option<u64> {
    let legal = board.legal_moves(player);
    if legal == 0 {
        return Some(0);
    }
    let mut moves = Vec::new();
    let mut bb = legal;
    while bb != 0 {
        let mv = bb & (!bb + 1);
        bb &= bb - 1;
        moves.push(mv);
    }
    let mut rng = thread_rng();
    moves.choose(&mut rng).copied()
}
