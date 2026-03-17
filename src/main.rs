mod ai;
mod bitboard;
mod board;

use crate::ai::best_move_minimax;
use crate::bitboard::{bit_at, Color};
use crate::board::Board;

fn parse_square(s: &str) -> Result<u64, String> {
    let bytes = s.as_bytes();
    if bytes.len() != 2 {
        return Err("Expected square like 'd3'".into());
    }
    let file = bytes[0];
    let rank = bytes[1];
    if !(b'a'..=b'h').contains(&file) || !(b'1'..=b'8').contains(&rank) {
        return Err("Square out of range a1..h8".into());
    }
    let file_idx = file - b'a';
    let rank_idx = rank - b'1';
    Ok(bit_at(file_idx, rank_idx))
}

fn main() {
    let mut board = Board::new();

    let human = Color::Black;
    let ai = human.opponent();
    let depth = read_depth().unwrap_or(6);

    'game: loop {
        println!("{}", board);
        println!(
            "Side to move: {:?}, Black: {}, White: {}",
            board.side_to_move,
            board.count(Color::Black),
            board.count(Color::White)
        );

        if !board.has_legal_move(Color::Black) && !board.has_legal_move(Color::White) {
            let eval = board.evaluate(human);
            println!("Game over. Eval for human: {}", eval);
            break;
        }

        if board.side_to_move == human {
            let legal = board.legal_moves(human);
            if legal == 0 {
                println!("No legal moves. Pass.");
                board.apply_move(0).unwrap();
                continue;
            }
            println!("Legal moves: {}", moves_to_string(legal));
            let mv = loop {
                let input = match read_line("Your move (e.g. d3) or 'pass': ") {
                    Some(s) => s,
                    None => {
                        println!("EOF on stdin. Exiting game.");
                        break 'game;
                    }
                };
                if input.is_empty() {
                    println!("Empty input.");
                    continue;
                }
                if input == "pass" {
                    if board.has_legal_move(human) {
                        println!("Pass not allowed.");
                        continue;
                    }
                    break 0u64;
                }
                match parse_square(&input) {
                    Ok(m) => {
                        if (m & legal) != 0 {
                            break m;
                        }
                        println!("Illegal move.");
                    }
                    Err(e) => println!("{}", e),
                }
            };
            board.apply_move(mv).unwrap();
        } else {
            let (best, score) = best_move_minimax(board, ai, depth);
            if best == 0 {
                println!("AI passes. Eval: {}", score);
            } else {
                println!("AI plays {}. Eval: {}", square_from_bit(best), score);
            }
            board.apply_move(best).unwrap();
        }
    }
}

fn read_depth() -> Option<i32> {
    let mut args = std::env::args().skip(1);
    if let Some(arg) = args.next() {
        if let Ok(d) = arg.parse::<i32>() {
            if d > 0 {
                return Some(d);
            }
        }
    }
    if let Some(input) = read_line("Depth (positive int) or Enter for default: ") {
        if input.is_empty() {
            return None;
        }
        if let Ok(d) = input.parse::<i32>() {
            if d > 0 {
                return Some(d);
            }
        }
    }
    None
}


fn moves_to_string(mut bb: u64) -> String {
    let mut out = Vec::new();
    while bb != 0 {
        let mv = bb & (!bb + 1);
        bb &= bb - 1;
        out.push(square_from_bit(mv));
    }
    out.sort();
    out.join(" ")
}

fn square_from_bit(bit: u64) -> String {
    let idx = bit.trailing_zeros();
    let file = (idx % 8) as u8;
    let rank = (idx / 8) as u8;
    let file_c = (b'a' + file) as char;
    let rank_c = (b'1' + rank) as char;
    format!("{}{}", file_c, rank_c)
}

fn read_line(prompt: &str) -> Option<String> {
    use std::io::{self, Write};
    print!("{}", prompt);
    io::stdout().flush().ok();
    let mut s = String::new();
    let n = io::stdin().read_line(&mut s).ok()?;
    if n == 0 {
        return None;
    }
    Some(s.trim().to_lowercase())
}

#[cfg(test)]
mod tests {
    use super::parse_square;
    use crate::bitboard::{bit_at, Color};
    use crate::board::Board;

    fn popcount(bb: u64) -> u32 {
        bb.count_ones()
    }

    #[test]
    fn initial_position_counts() {
        let b = Board::new();
        assert_eq!(b.count(Color::Black), 2);
        assert_eq!(b.count(Color::White), 2);
    }

    #[test]
    fn initial_legal_moves_count() {
        let b = Board::new();
        let moves = b.legal_moves(Color::Black);
        assert_eq!(popcount(moves), 4);
    }

    #[test]
    fn apply_move_flips_one() {
        let mut b = Board::new();
        let mv = parse_square("c5").unwrap();
        b.apply_move(mv).unwrap();
        assert_eq!(b.count(Color::Black), 4);
        assert_eq!(b.count(Color::White), 1);
    }

    #[test]
    fn parse_square_ok() {
        assert_eq!(parse_square("a1").unwrap(), bit_at(0, 0));
        assert_eq!(parse_square("h8").unwrap(), bit_at(7, 7));
    }

    #[test]
    fn parse_square_err() {
        assert!(parse_square("i1").is_err());
        assert!(parse_square("a9").is_err());
        assert!(parse_square("aa").is_err());
    }
}
