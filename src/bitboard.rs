#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Color {
    Black,
    White,
}

impl Color {
    pub fn opponent(self) -> Self {
        match self {
            Color::Black => Color::White,
            Color::White => Color::Black,
        }
    }
}

pub const FILE_A: u64 = 0x0101_0101_0101_0101;
pub const FILE_H: u64 = 0x8080_8080_8080_8080;

#[inline]
pub fn bit_at(file: u8, rank: u8) -> u64 {
    1u64 << (file as u64 + 8 * rank as u64)
}

#[inline]
pub fn shift_n(x: u64) -> u64 {
    x << 8
}
#[inline]
pub fn shift_s(x: u64) -> u64 {
    x >> 8
}
#[inline]
pub fn shift_e(x: u64) -> u64 {
    (x & !FILE_H) << 1
}
#[inline]
pub fn shift_w(x: u64) -> u64 {
    (x & !FILE_A) >> 1
}
#[inline]
pub fn shift_ne(x: u64) -> u64 {
    (x & !FILE_H) << 9
}
#[inline]
pub fn shift_nw(x: u64) -> u64 {
    (x & !FILE_A) << 7
}
#[inline]
pub fn shift_se(x: u64) -> u64 {
    (x & !FILE_H) >> 7
}
#[inline]
pub fn shift_sw(x: u64) -> u64 {
    (x & !FILE_A) >> 9
}

pub fn gen_moves(p: u64, o: u64) -> u64 {
    // Standard bitboard move generation (no empties yet).
    let mut moves = 0u64;
    moves |= ray_moves(p, o, shift_n);
    moves |= ray_moves(p, o, shift_s);
    moves |= ray_moves(p, o, shift_e);
    moves |= ray_moves(p, o, shift_w);
    moves |= ray_moves(p, o, shift_ne);
    moves |= ray_moves(p, o, shift_nw);
    moves |= ray_moves(p, o, shift_se);
    moves |= ray_moves(p, o, shift_sw);
    moves
}

fn ray_moves(p: u64, o: u64, shift: fn(u64) -> u64) -> u64 {
    let mut m = shift(p) & o;
    for _ in 0..5 {
        m |= shift(m) & o;
    }
    shift(m)
}

pub fn flips_for_move(mv: u64, p: u64, o: u64) -> u64 {
    flips_dir(mv, p, o, shift_n)
        | flips_dir(mv, p, o, shift_s)
        | flips_dir(mv, p, o, shift_e)
        | flips_dir(mv, p, o, shift_w)
        | flips_dir(mv, p, o, shift_ne)
        | flips_dir(mv, p, o, shift_nw)
        | flips_dir(mv, p, o, shift_se)
        | flips_dir(mv, p, o, shift_sw)
}

fn flips_dir(mv: u64, p: u64, o: u64, shift: fn(u64) -> u64) -> u64 {
    let mut cur = shift(mv);
    let mut acc = 0u64;
    while cur != 0 && (cur & o) != 0 {
        acc |= cur;
        cur = shift(cur);
    }
    if cur & p != 0 {
        acc
    } else {
        0
    }
}
