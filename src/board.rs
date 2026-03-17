use std::fmt;

use crate::bitboard::{bit_at, flips_for_move, gen_moves, Color};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Board {
    black: u64,
    white: u64,
    pub side_to_move: Color,
}

#[derive(Clone, Copy, Debug)]
pub struct EvalParams {
    // Scales are percentages. 100 = 1.0
    pub material_scale: i32,
    pub mobility_scale: i32,
    pub mobility_penalty_scale: i32,
    pub pst_scale: i32,
}

pub const DEFAULT_EVAL_PARAMS: EvalParams = EvalParams {
    material_scale: 85,
    mobility_scale: 130,
    mobility_penalty_scale: 150,
    pst_scale: 120,
};

impl Board {
    pub fn new() -> Self {
        // Bit 0 = A1, bit 63 = H8 (file + 8*rank).
        let black = bit_at(3, 3) | bit_at(4, 4); // d4, e5
        let white = bit_at(3, 4) | bit_at(4, 3); // d5, e4
        Self {
            black,
            white,
            side_to_move: Color::Black,
        }
    }

    pub fn occupied(self) -> u64 {
        self.black | self.white
    }

    pub fn empty(self) -> u64 {
        !self.occupied()
    }

    pub fn empty_count(self) -> u32 {
        64 - (self.black | self.white).count_ones()
    }

    pub fn pieces(self, c: Color) -> u64 {
        match c {
            Color::Black => self.black,
            Color::White => self.white,
        }
    }

    pub fn hash(self) -> u128 {
        let side = match self.side_to_move {
            Color::Black => 0u128,
            Color::White => 1u128,
        };
        (self.black as u128) | ((self.white as u128) << 64) | (side << 127)
    }

    pub fn count(self, c: Color) -> u32 {
        self.pieces(c).count_ones()
    }

    pub fn evaluate(self, c: Color) -> i32 {
        self.evaluate_for_depth(c, i32::MAX)
    }

    pub fn evaluate_for_depth(self, c: Color, depth_remaining: i32) -> i32 {
        self.evaluate_for_depth_with(c, depth_remaining, DEFAULT_EVAL_PARAMS)
    }

    pub fn evaluate_for_depth_with(
        self,
        c: Color,
        depth_remaining: i32,
        params: EvalParams,
    ) -> i32 {
        // Positive = good for color c.
        let my = self.pieces(c);
        let opp = self.pieces(c.opponent());

        let my_count = my.count_ones() as i32;
        let opp_count = opp.count_ones() as i32;
        let empties = self.empty_count() as i32;

        if empties <= depth_remaining {
            // End of search horizon: evaluate purely by material.
            return apply_scale(my_count - opp_count, params.material_scale);
        }

        // Phase goes from 0 (opening) to 100 (endgame).
        let phase = ((64 - empties) * 100 / 64) as i32;

        // Non-linear weighting:
        // - Opening: corners are very strong (weight 60).
        // - Endgame (<= 6 empties): material dominates.
        let endgame = empties <= 6;
        let piece_weight = if endgame {
            60
        } else {
            4 + phase / 6 // 4..20
        };
        let mobility_weight = if endgame { 4 } else { 12 - phase / 10 }; // 12..4
        let corner_weight = if endgame { 25 } else { 60 - phase / 8 }; // 60..47

        let material = apply_scale((my_count - opp_count) * piece_weight, params.material_scale);

        let my_moves = self.legal_moves(c).count_ones() as i32;
        let opp_moves = self.legal_moves(c.opponent()).count_ones() as i32;
        let mobility =
            apply_scale((my_moves - opp_moves) * mobility_weight, params.mobility_scale);

        // Strong penalty for having very few or no moves.
        let mut mobility_penalty = 0;
        if my_moves == 0 {
            mobility_penalty -= 120;
        } else if my_moves <= 2 {
            mobility_penalty -= 40;
        }
        if opp_moves == 0 {
            mobility_penalty += 120;
        } else if opp_moves <= 2 {
            mobility_penalty += 40;
        }
        mobility_penalty = apply_scale(mobility_penalty, params.mobility_penalty_scale);

        // Using PST for positional value; corners/edges are already encoded there.
        let _corner_weight = corner_weight;
        let _edge_weight = if endgame { 10 } else { 16 - phase / 12 };

        let pst = apply_scale(piece_square_table(my, opp, phase), params.pst_scale);

        material + mobility + mobility_penalty + pst
    }

    pub fn legal_moves(self, c: Color) -> u64 {
        let p = self.pieces(c);
        let o = self.pieces(c.opponent());
        gen_moves(p, o) & self.empty()
    }

    pub fn has_legal_move(self, c: Color) -> bool {
        self.legal_moves(c) != 0
    }

    pub fn apply_move(&mut self, mv: u64) -> Result<(), String> {
        if mv == 0 {
            if self.has_legal_move(self.side_to_move) {
                return Err("Pass not allowed: legal moves exist".into());
            }
            self.side_to_move = self.side_to_move.opponent();
            return Ok(());
        }

        let legal = self.legal_moves(self.side_to_move);
        if mv & legal == 0 {
            return Err("Illegal move".into());
        }

        let player = self.side_to_move;
        let opp = player.opponent();
        let p = self.pieces(player);
        let o = self.pieces(opp);

        let flips = flips_for_move(mv, p, o);
        let new_p = p | mv | flips;
        let new_o = o & !flips;
        self.set_pieces(player, new_p);
        self.set_pieces(opp, new_o);
        self.side_to_move = opp;
        Ok(())
    }

    fn set_pieces(&mut self, c: Color, bb: u64) {
        match c {
            Color::Black => self.black = bb,
            Color::White => self.white = bb,
        }
    }
}

fn piece_square_table(my: u64, opp: u64, phase: i32) -> i32 {
    // Standard Othello PST emphasizing corners and safe edges.
    const PST: [i32; 64] = [
        100, -20, 10, 5, 5, 10, -20, 100, // 8
        -20, -50, -2, -2, -2, -2, -50, -20, // 7
        10, -2, -1, -1, -1, -1, -2, 10, // 6
        5, -2, -1, -1, -1, -1, -2, 5, // 5
        5, -2, -1, -1, -1, -1, -2, 5, // 4
        10, -2, -1, -1, -1, -1, -2, 10, // 3
        -20, -50, -2, -2, -2, -2, -50, -20, // 2
        100, -20, 10, 5, 5, 10, -20, 100, // 1
    ];

    let mut score = 0i32;
    for i in 0..64 {
        let bit = 1u64 << i;
        if (my & bit) != 0 {
            score += PST[i];
        } else if (opp & bit) != 0 {
            score -= PST[i];
        }
    }
    let weight = 12 - phase / 10; // 12..2 (opening stronger)
    score * weight / 10
}

fn apply_scale(value: i32, scale: i32) -> i32 {
    value * scale / 100
}

impl fmt::Display for Board {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(f, "  a b c d e f g h")?;
        for rank in (0..8).rev() {
            write!(f, "{} ", rank + 1)?;
            for file in 0..8 {
                let bit = bit_at(file, rank);
                let ch = if self.black & bit != 0 {
                    'B'
                } else if self.white & bit != 0 {
                    'W'
                } else {
                    '.'
                };
                write!(f, "{} ", ch)?;
            }
            writeln!(f)?;
        }
        Ok(())
    }
}
