mod ai;
mod bitboard;
mod board;

use wasm_bindgen::prelude::*;

use crate::ai::best_move_iterative_with_params;
use crate::bitboard::{bit_at, Color};
use crate::board::{Board, DEFAULT_EVAL_PARAMS};

fn color_from_u8(v: u8) -> Result<Color, JsValue> {
    match v {
        0 => Ok(Color::Black),
        1 => Ok(Color::White),
        _ => Err(JsValue::from_str("Color must be 0 (Black) or 1 (White)")),
    }
}

fn color_to_u8(c: Color) -> u8 {
    match c {
        Color::Black => 0,
        Color::White => 1,
    }
}

fn bit_from_idx(idx: u32) -> Result<u64, JsValue> {
    if idx >= 64 {
        return Err(JsValue::from_str("Index out of range 0..63"));
    }
    let file = (idx % 8) as u8;
    let rank = (idx / 8) as u8;
    Ok(bit_at(file, rank))
}

#[wasm_bindgen]
pub struct Game {
    board: Board,
    human: Color,
    ai: Color,
    depth: i32,
    last_move_idx: u32,
    last_flips: Vec<u32>,
    last_move_player: u8,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new(human_color: u8, depth: i32) -> Result<Game, JsValue> {
        let human = color_from_u8(human_color)?;
        let ai = human.opponent();
        Ok(Game {
            board: Board::new(),
            human,
            ai,
            depth: depth.max(1),
            last_move_idx: 64,
            last_flips: Vec::new(),
            last_move_player: 255,
        })
    }

    pub fn reset(&mut self, human_color: u8) -> Result<(), JsValue> {
        self.human = color_from_u8(human_color)?;
        self.ai = self.human.opponent();
        self.board = Board::new();
        self.last_move_idx = 64;
        self.last_flips.clear();
        self.last_move_player = 255;
        Ok(())
    }

    pub fn set_human_color(&mut self, human_color: u8) -> Result<(), JsValue> {
        self.human = color_from_u8(human_color)?;
        self.ai = self.human.opponent();
        Ok(())
    }

    pub fn set_depth(&mut self, depth: i32) {
        if depth > 0 {
            self.depth = depth;
        }
    }

    pub fn side_to_move(&self) -> u8 {
        color_to_u8(self.board.side_to_move)
    }

    pub fn board_cells(&self) -> Vec<u8> {
        let mut out = vec![0u8; 64];
        let black = self.board.pieces(Color::Black);
        let white = self.board.pieces(Color::White);
        for i in 0..64 {
            let bit = 1u64 << i;
            if black & bit != 0 {
                out[i] = 1;
            } else if white & bit != 0 {
                out[i] = 2;
            }
        }
        out
    }

    pub fn legal_moves(&self) -> Vec<u8> {
        let mask = self.board.legal_moves(self.board.side_to_move);
        let mut out = vec![0u8; 64];
        for i in 0..64 {
            if (mask >> i) & 1 == 1 {
                out[i] = 1;
            }
        }
        out
    }

    pub fn legal_move_evals(&self) -> Vec<i32> {
        let mask = self.board.legal_moves(self.board.side_to_move);
        let mut out = vec![0i32; 64];
        let player = self.board.side_to_move;
        for i in 0..64 {
            if (mask >> i) & 1 == 1 {
                let mut b = self.board;
                let mv = 1u64 << i;
                if b.apply_move(mv).is_ok() {
                    out[i] = b.evaluate_for_depth(player, self.depth);
                }
            }
        }
        out
    }

    pub fn apply_human_move(&mut self, idx: u32) -> Result<(), JsValue> {
        if self.board.side_to_move != self.human {
            return Err(JsValue::from_str("Not human turn"));
        }
        let mv = bit_from_idx(idx)?;
        let player = self.board.side_to_move;
        let opp = player.opponent();
        let before_opp = self.board.pieces(opp);
        self.board
            .apply_move(mv)
            .map_err(|e| JsValue::from_str(&e))?;
        let after_opp = self.board.pieces(opp);
        let flips = before_opp & !after_opp;
        self.last_move_idx = idx;
        self.last_flips = bitboard_to_indices(flips);
        self.last_move_player = color_to_u8(player);
        Ok(())
    }

    pub fn pass(&mut self) -> Result<(), JsValue> {
        self.board
            .apply_move(0)
            .map_err(|e| JsValue::from_str(&e))?;
        self.last_move_idx = 64;
        self.last_flips.clear();
        self.last_move_player = 255;
        Ok(())
    }

    pub fn ai_move(&mut self) -> Result<u32, JsValue> {
        if self.board.side_to_move != self.ai {
            return Err(JsValue::from_str("Not AI turn"));
        }
        let legal = self.board.legal_moves(self.ai);
        if legal == 0 {
            self.board
                .apply_move(0)
                .map_err(|e| JsValue::from_str(&e))?;
            self.last_move_idx = 64;
            self.last_flips.clear();
            self.last_move_player = 255;
            return Ok(64);
        }
        let (best, _score) =
            best_move_iterative_with_params(self.board, self.ai, self.depth, DEFAULT_EVAL_PARAMS);
        let player = self.board.side_to_move;
        let opp = player.opponent();
        let before_opp = self.board.pieces(opp);
        self.board
            .apply_move(best)
            .map_err(|e| JsValue::from_str(&e))?;
        let after_opp = self.board.pieces(opp);
        let flips = before_opp & !after_opp;
        let idx = best.trailing_zeros();
        self.last_move_idx = idx;
        self.last_flips = bitboard_to_indices(flips);
        self.last_move_player = color_to_u8(player);
        Ok(idx)
    }

    pub fn is_game_over(&self) -> bool {
        !self.board.has_legal_move(Color::Black) && !self.board.has_legal_move(Color::White)
    }

    pub fn score_black(&self) -> u32 {
        self.board.count(Color::Black)
    }

    pub fn score_white(&self) -> u32 {
        self.board.count(Color::White)
    }

    pub fn eval_for_human(&self) -> i32 {
        self.board.evaluate(self.human)
    }

    pub fn material_eval_for_human(&self) -> i32 {
        let my = self.board.pieces(self.human).count_ones() as i32;
        let opp = self
            .board
            .pieces(self.human.opponent())
            .count_ones() as i32;
        my - opp
    }

    pub fn last_move_idx(&self) -> u32 {
        self.last_move_idx
    }

    pub fn last_flips(&self) -> Vec<u32> {
        self.last_flips.clone()
    }

    pub fn last_move_player(&self) -> u8 {
        self.last_move_player
    }
}

fn bitboard_to_indices(mut bb: u64) -> Vec<u32> {
    let mut out = Vec::new();
    while bb != 0 {
        let bit = bb & (!bb + 1);
        bb &= bb - 1;
        out.push(bit.trailing_zeros());
    }
    out
}
