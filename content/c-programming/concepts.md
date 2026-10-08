# GATE CSE — C Programming: Complete Concepts + Practice Notebook

> A rank-oriented, exam-focused rebuild of your *C Programming Concepts* notes, extended to cover the full **Programming in C** part of the GATE CSE syllabus (plus C-based Data Structures code tracing).
> **Concept → Examples → Traps → Practice → Mistakes → Revision.**

---

## How to use this file
1. Read a chapter's **concept section** once, actively (type the examples, don't just read).
2. Attempt the **practice questions without opening the answer key** (time yourself: 1 mark ≈ 1.8 min).
3. Check the **Answer Key** at the end of each chapter and log every mistake using the template in Chapter 22.
4. Re-attempt the questions you missed after 3 and 7 days; take the **Mock Test (Ch 21)** at the end of each pass.
5. For every code question, first ask: **"Is this code even well-defined?"**

**Question types:** `MCQ` (one correct option), `MSQ` (one or more correct), `NAT` (numerical answer), `Output` (find what the program prints / its value — in the exam this appears as MCQ or NAT). Marks are marked **1M / 2M** like GATE.

**Default machine assumptions** (state them in the exam if the question does not): `char` = 1 byte, `short` = 2, `int` = 4, `long` = 8, `long long` = 8, `float` = 4, `double` = 8, pointer = 8 bytes (64-bit), little-endian, two's complement, ASCII, natural alignment. Questions that depend on other assumptions say so.

**✅ in an answer key** means the program's output was **compiled and run (gcc 13, x86-64 Linux)** and matched the stated answer. Questions without ✅ are conceptual/MCQ/NAT items worked out by reasoning, or programs that depend on external state (files, command-line).

**Contents:** 22 chapters · 228 practice questions · 297 marks of practice.

> **Note on PYQs:** the questions here are *GATE-style* original practice problems modelled on the patterns that recur in GATE CSE. For actual previous-year questions (with years and keys), solve the official GATE papers topic-wise alongside each chapter — use Notebook 2 for them.

---

## Syllabus coverage map
| GATE CSE syllabus item (Programming in C / Recursion) | Chapter(s) |
|---|---|
| Program structure, tokens, constants, data types, variables | 1, 2 |
| Operators, precedence, associativity, expressions, side effects | 3, 5, 6 |
| Type conversion, promotion, casting | 4 |
| Control structures (if, switch, loops, jumps) | 7 |
| Input/Output, formatted I/O, files, command-line arguments | 8, 19 |
| Functions, parameter passing (by value), recursion | 9 |
| Storage classes, scope, lifetime, linkage | 10 |
| Arrays (1-D, multi-D), address calculation | 11 |
| Pointers, pointer arithmetic, pointer to pointer, function pointers, declarations | 12, 13 |
| Strings and string library | 14 |
| Structures, unions, enums, typedef, padding/alignment | 15 |
| Dynamic memory allocation, linked structures | 16, 20 |
| Preprocessor and macros | 17 |
| const / volatile / restrict, memory model, stack frames | 13, 18 |
| Undefined / unspecified / implementation-defined behaviour | 6 |
| Code tracing, bit tricks, DS routines in C | 5, 20, 21, 22 |

---

## Table of contents

- [Chapter 1 — C Fundamentals: Structure, Tokens, Constants, Number Systems](#chapter-1--c-fundamentals-structure-tokens-constants-number-systems)
- [Chapter 2 — Data Types, Ranges and Overflow](#chapter-2--data-types-ranges-and-overflow)
- [Chapter 3 — Operators, Precedence and Expression Evaluation](#chapter-3--operators-precedence-and-expression-evaluation)
- [Chapter 4 — Type Conversion, Promotion and Casting](#chapter-4--type-conversion-promotion-and-casting)
- [Chapter 5 — Bitwise Operators and Bit Manipulation](#chapter-5--bitwise-operators-and-bit-manipulation)
- [Chapter 6 — Undefined, Unspecified and Implementation-Defined Behaviour; Sequence Points](#chapter-6--undefined-unspecified-and-implementation-defined-behaviour-sequence-points)
- [Chapter 7 — Control Flow: if, switch, Loops, break, continue, goto](#chapter-7--control-flow-if-switch-loops-break-continue-goto)
- [Chapter 8 — Input / Output: printf, scanf and Friends](#chapter-8--input--output-printf-scanf-and-friends)
- [Chapter 9 — Functions, Parameter Passing and Recursion](#chapter-9--functions-parameter-passing-and-recursion)
- [Chapter 10 — Storage Classes, Scope, Lifetime and Linkage](#chapter-10--storage-classes-scope-lifetime-and-linkage)
- [Chapter 11 — Arrays (1-D, Multi-Dimensional, Address Calculation)](#chapter-11--arrays-1-d-multi-dimensional-address-calculation)
- [Chapter 12 — Pointers: Arithmetic, Operators, Pitfalls](#chapter-12--pointers-arithmetic-operators-pitfalls)
- [Chapter 13 — Complex Declarations, Function Pointers, const / volatile / restrict](#chapter-13--complex-declarations-function-pointers-const--volatile--restrict)
- [Chapter 14 — Strings and the string.h Library](#chapter-14--strings-and-the-stringh-library)
- [Chapter 15 — Structures, Unions, Enums, typedef, Bit-fields, Padding](#chapter-15--structures-unions-enums-typedef-bit-fields-padding)
- [Chapter 16 — Dynamic Memory Allocation](#chapter-16--dynamic-memory-allocation)
- [Chapter 17 — The Preprocessor and Macros](#chapter-17--the-preprocessor-and-macros)
- [Chapter 18 — Memory Model, Stack Frames and Runtime Behaviour](#chapter-18--memory-model-stack-frames-and-runtime-behaviour)
- [Chapter 19 — Command-Line Arguments, Files and Standard Library Odds & Ends](#chapter-19--command-line-arguments-files-and-standard-library-odds--ends)
- [Chapter 20 — C Code for Data Structures & Algorithms: GATE-Style Tracing](#chapter-20--c-code-for-data-structures--algorithms-gate-style-tracing)
- [Chapter 21 — Mixed Timed Mock Test (Chapters 1–20)](#chapter-21--mixed-timed-mock-test-chapters-120)
- [Chapter 22 — Revision Pack: Tracing Method, Traps, Micro-Rules, Cheat-Sheet, Mistake Notebook](#chapter-22--revision-pack-tracing-method-traps-micro-rules-cheat-sheet-mistake-notebook)

---

## Chapter 1 — C Fundamentals: Structure, Tokens, Constants, Number Systems


### 1.1 Structure of a C program
```c
#include <stdio.h>      // preprocessor directive (handled BEFORE compilation)

int main() {            // execution always begins at main()
    printf("Hello");    // statement
    return 0;           // 0 = successful termination
}
```

### 1.2 Tokens
A C program is a sequence of **tokens**. The six categories are: **keywords, identifiers, constants, string literals, operators, punctuators**.

`int x = 10;` has 5 tokens: `int`, `x`, `=`, `10`, `;`

> **Maximal munch rule:** the lexer always builds the *longest* possible token. So `a+++b` is `a ++ + b`, not `a + ++ b`, and `x+++++y` is a syntax error (`x ++ ++ + y`).

### 1.3 Keywords (32 in C89; C99 adds `inline`, `restrict`, `_Bool`, `_Complex`, `_Imaginary`)
`auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while`

Keywords cannot be used as identifiers.

### 1.4 Identifiers
Names for variables, functions, arrays, structures, etc.
- May contain letters, digits and `_`
- Cannot **begin** with a digit
- Cannot be a keyword
- **Case-sensitive**: `count`, `Count`, `COUNT` are three different identifiers

### 1.5 Constants
| Kind | Examples | Notes |
|---|---|---|
| Integer (decimal) | `10`, `10u`, `10L`, `10UL` | suffixes `u/U`, `l/L`, `ll/LL` |
| Integer (octal) | `012` = 10 | leading `0`; digits 8 and 9 are **invalid** (`08`, `09` are errors) |
| Integer (hex) | `0x1A` = 26 | prefix `0x` / `0X` |
| Floating | `3.14` (double), `3.14f` (float), `1e3` | `1e3` is a **floating** constant, not an integer |
| Character | `'A'` | type is **`int`** in C (so `sizeof('A') == sizeof(int)`) |
| String literal | `"ABC"` | array of `char` ending in `'\0'` (4 bytes for "ABC") |

`'A'` (character constant) ≠ `"A"` (string literal, 2 bytes: `'A'`, `'\0'`).

**Escape sequences:** `\n` newline, `\t` tab, `\\`, `\'`, `\"`, `\0` null, `\ooo` octal (`'\101'` = 65), `\xhh` hex (`'\x41'` = 65).

### 1.6 Variables
```c
int x;          // declaration (definition inside a function)
int x = 10;     // declaration + initialization
int a, b, c;    // multiple declarations
```

### 1.7 Number systems and conversions
| System | Base | Digits | In C |
|---|---|---|---|
| Binary | 2 | 0,1 | (`0b1011` is a GCC/C23 extension, not classic C) |
| Octal | 8 | 0–7 | `012` |
| Decimal | 10 | 0–9 | `10` |
| Hexadecimal | 16 | 0–9, A–F | `0x1A` |

- `1011₂ = 1×8 + 0×4 + 1×2 + 1 = 11`
- **Binary ↔ Octal:** group **3 bits**: `101 101₂ = 55₈`
- **Binary ↔ Hex:** group **4 bits**: `1010 1111₂ = AF₁₆`
- `3 bits → 1 octal digit`, `4 bits → 1 hex digit`

### 1.8 Comments
`/* ... */` (all C) and `// ...` (C99 onward). Comments do not nest.

### Practice Questions — Chapter 1  *(10 questions, 11 marks)*

**Q1.1**  `MCQ · 1M`  Which of the following is a valid C identifier?

- (A) `2fast`
- (B) `my-var`
- (C) `_count`
- (D) `int`

**Q1.2**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 012 + 0x1A + 10;
    printf("%d", x);
}
```

**Q1.3**  `MSQ · 1M`  Which of the following is/are **NOT** a valid integer constant in C?

- (A) `089`
- (B) `0x1G`
- (C) `0xFFu`
- (D) `1e3`

**Q1.4**  `NAT · 1M`  The octal equivalent of the hexadecimal number `0x3F` is ______.

**Q1.5**  `Output · 1M`  Assume `sizeof(int) == 4`. What is the output?

```c
int main() {
    printf("%zu %zu", sizeof('A'), sizeof("A"));
}
```

**Q1.6**  `NAT · 1M`  The number of tokens in the statement `printf("%d", a+++b);` is ______.

**Q1.7**  `Output · 2M`  What is the output?

```c
int main() {
    printf("%zu", sizeof("A\n\0B"));
}
```

**Q1.8**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d", 010 + 10);
}
```

**Q1.9**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d %d", '\101', '\x41');
}
```

**Q1.10**  `MCQ · 1M`  Which statement about `main()` is true?

- (A) Execution begins at the first function defined in the file
- (B) Execution begins at `main()` irrespective of where it is defined
- (C) `main` must be the last function in the file
- (D) `main` cannot call other functions

### Answer Key — Chapter 1

- **1.1** — **(C)** — `2fast` starts with a digit, `my-var` contains `-` (it would be `my - var`), `int` is a keyword.
- **1.2** — Output: `46` ✅ — `012` is octal = 10, `0x1A` = 26, so 10 + 26 + 10 = 46.
- **1.3** — **(A), (B), (D)** — `089` has digits 8/9 in an octal constant; `0x1G` has a non-hex digit; `1e3` is a *floating* constant. `0xFFu` is a valid unsigned hex integer constant.
- **1.4** — **77** — `3F = 0011 1111`; regroup in 3 bits: `111 111` → `77₈` (= 63 decimal).
- **1.5** — Output: `4 2` ✅ — In C a character constant has type `int` (4 bytes). `"A"` is `{'A','\0'}` = 2 bytes.
- **1.6** — **10** — `printf` `(` `"%d"` `,` `a` `++` `+` `b` `)` `;` = 10 tokens (maximal munch splits `a+++b` as `a ++ + b`).
- **1.7** — Output: `5` ✅ — Characters: `A`, `\n`, `\0`, `B` plus the implicit terminating `\0` = 5 bytes. `sizeof` counts every byte; `strlen` would stop at the first `\0` and give 2.
- **1.8** — Output: `18` ✅ — `010` is octal = 8; 8 + 10 = 18.
- **1.9** — Output: `65 65` ✅ — `\101` is octal escape = 65 and `\x41` is hex escape = 65 (the ASCII code of `'A'`).
- **1.10** — **(B)** — The runtime starts the program at `main()`; its position in the file is irrelevant (declare functions before use).


---

## Chapter 2 — Data Types, Ranges and Overflow


### 2.1 Fundamental types
`char`, `int`, `float`, `double`, `void`; modifiers `short`, `long`, `long long`, `signed`, `unsigned`.

### 2.2 Sizes (implementation-dependent!)
The standard only guarantees: `sizeof(char) == 1` (always, by definition) and
`sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)`.

| Type | Typical size (bytes) | Notes |
|---|---|---|
| `char` | 1 | 1 byte is *not necessarily* 8 bits (`CHAR_BIT`) |
| `short` | 2 | |
| `int` | 4 | 2 on very old 16-bit compilers |
| `long` | 4 (Windows/32-bit) or 8 (64-bit Linux) | |
| `long long` | 8 | |
| `float` | 4 | IEEE-754: 1 sign + 8 exp + 23 mantissa |
| `double` | 8 | IEEE-754: 1 sign + 11 exp + 52 mantissa |
| pointer | 4 (32-bit) / 8 (64-bit) | same for all object pointers on common machines |

> **GATE trap:** do not assume sizes unless the question states them. Most GATE questions say "assume int = 4 bytes, pointer = 4 bytes (or 8)".

### 2.3 Ranges
- **n-bit unsigned:** `0` to `2ⁿ − 1`
- **n-bit signed (two's complement):** `−2ⁿ⁻¹` to `2ⁿ⁻¹ − 1`
- 8-bit signed: −128..127 | 16-bit signed: −32768..32767 | 32-bit signed: −2³¹..2³¹−1

**Two's complement:** `−x = ~x + 1`, and therefore `~x = −x − 1` (e.g. `~5 = −6`, `~−5 = 4`).

### 2.4 Overflow rules
| Case | Result |
|---|---|
| **Unsigned** overflow/underflow | Well-defined: wraps modulo 2ⁿ (`(unsigned)−1 == UINT_MAX`) |
| **Signed** integer overflow | **Undefined behaviour** |
| Converting an out-of-range value to a signed type | Implementation-defined |
| Right shift of a negative signed value | Implementation-defined |

### 2.5 `char`
`char` holds an integer character code. Whether plain `char` is signed or unsigned is **implementation-defined**; use `signed char`/`unsigned char` when it matters. `'A' + 1` is the integer 66.

### 2.6 Floating point
`float < double < long double` in precision (exact formats are implementation-dependent).
- Most decimal fractions (0.1, 0.2) have no exact binary representation, so **never compare floating values with `==`**.
- `0.1` is a `double` constant; `0.1f` is `float`. `float f = 0.1; f == 0.1` is **false** (f was rounded to float precision).
- `0.1 + 0.2 == 0.3` is false for doubles.
- Integer division by zero is UB; floating division by zero (IEEE-754) gives `inf`/`nan`.

### 2.7 Type qualifiers
`const`, `volatile`, `restrict` (see Chapter 17). `_Bool`/`bool` (`<stdbool.h>`) holds only 0 or 1 (any non-zero converts to 1).

### Practice Questions — Chapter 2  *(12 questions, 15 marks)*

**Q2.1**  `Output · 1M`  What is the output?

```c
int main() {
    unsigned char c = 255;
    c++;
    printf("%d", c);
}
```

**Q2.2**  `Output · 2M`  Assume 32-bit `int`. What is printed?

```c
int main() {
    unsigned int a = 5;
    int b = -10;
    if (a > b) printf("A");
    else       printf("B");
}
```

**Q2.3**  `NAT · 1M`  The minimum value representable in a 12-bit two's-complement signed integer is ______.

**Q2.4**  `Output · 1M`  Assume 32-bit `int`. What is printed?

```c
int main() {
    unsigned int x = 0;
    x--;
    printf("%u", x);
}
```

**Q2.5**  `Output · 2M`  What is the output?

```c
int main() {
    float f = 0.1;
    if (f == 0.1) printf("Equal");
    else          printf("Not equal");
}
```

**Q2.6**  `Output · 1M`  What is the output?

```c
int main() {
    char c = 'A';
    printf("%d %c", c + 1, c + 1);
}
```

**Q2.7**  `NAT · 1M`  A 10-bit two's-complement system: (largest positive value) + (smallest negative value) = ______.

**Q2.8**  `MCQ · 1M`  What does the C standard say about `int a = INT_MAX; a = a + 1;`?

- (A) `a` wraps to INT_MIN
- (B) Undefined behaviour
- (C) Implementation-defined
- (D) Unspecified

**Q2.9**  `MCQ · 1M`  Which of the following is **always** true according to the C standard?

- (A) `sizeof(int) == 4`
- (B) `sizeof(char) == 1`
- (C) `sizeof(long) > sizeof(int)`
- (D) `sizeof(float) == 4`

**Q2.10**  `Output · 2M`  What is the output?

```c
int main() {
    unsigned short s = 65535;
    s += 2;
    printf("%u", s);
}
```

**Q2.11**  `Output · 1M`  What is the output?

```c
int main() {
    unsigned char u = -1;
    printf("%d", u);
}
```

**Q2.12**  `Output · 1M`  What is the output?

```c
int main() {
    double a = 0.1 + 0.2;
    if (a == 0.3) printf("yes");
    else          printf("no");
}
```

### Answer Key — Chapter 2

- **2.1** — Output: `0` ✅ — `c++` makes 256, which wraps modulo 256 → 0 (unsigned wrap is well-defined).
- **2.2** — Output: `B` ✅ — `b` is converted to `unsigned` (4294967286), so `5 > 4294967286` is false. Signed/unsigned mixing → signed operand becomes unsigned.
- **2.3** — **-2048** — `−2¹¹ = −2048`.
- **2.4** — Output: `4294967295` ✅ — Unsigned underflow wraps: `0 − 1 = 2³² − 1`.
- **2.5** — Output: `Not equal` ✅ — `0.1` is a double; `f` holds the nearest *float* to 0.1, which differs from the nearest double. The float is promoted to double before comparing.
- **2.6** — Output: `66 B` ✅ — `c + 1` is an `int` 66; `%c` prints the character with that code.
- **2.7** — **-1** — Largest = 2⁹−1 = 511, smallest = −2⁹ = −512; sum = −1.
- **2.8** — **(B)** — Signed overflow is UB. Only unsigned arithmetic is guaranteed to wrap.
- **2.9** — **(B)** — Only `sizeof(char) == 1` is guaranteed. The others are implementation-dependent (`long` may equal `int`).
- **2.10** — Output: `1` ✅ — `s + 2` is computed as int = 65537, then converted back to `unsigned short`: 65537 mod 65536 = 1.
- **2.11** — Output: `255` ✅ — −1 converted to `unsigned char` = 256 − 1 = 255.
- **2.12** — Output: `no` ✅ — 0.1 and 0.2 are not exactly representable; the sum is 0.30000000000000004, not the double nearest 0.3.


---

## Chapter 3 — Operators, Precedence and Expression Evaluation


### 3.1 Precedence and associativity (high → low)
| Level | Operators | Associativity |
|---|---|---|
| 1 | `()` `[]` `->` `.` , postfix `++ --` | L → R |
| 2 | prefix `++ --`, unary `+ -`, `! ~`, `(type)`, `*` (deref), `&`, `sizeof` | **R → L** |
| 3 | `* / %` | L → R |
| 4 | `+ -` | L → R |
| 5 | `<< >>` | L → R |
| 6 | `< <= > >=` | L → R |
| 7 | `== !=` | L → R |
| 8 | `&` | L → R |
| 9 | `^` | L → R |
| 10 | `\|` | L → R |
| 11 | `&&` | L → R |
| 12 | `\|\|` | L → R |
| 13 | `?:` | **R → L** |
| 14 | `= += -= *= /= %= <<= >>= &= ^= \|=` | **R → L** |
| 15 | `,` | L → R |

*(Postfix `++`/`--` sit in the same top group as `()` `[]` `->` `.`.)*

**Mnemonic:** Call → Post → Unary → Multiply → Add → Shift → Relational → Equality → Bitwise(& ^ \|) → Logical(&& \|\|) → Conditional → Assignment → Comma.

**Classic precedence traps**
- `x & 1 == 0` is `x & (1 == 0)` — `==` binds tighter than `&`. Always parenthesize: `(x & 1) == 0`.
- `*p++` is `*(p++)`; `*p.roll` is `*(p.roll)`; use `p->roll` or `(*p).roll`.
- Unary `*` (dereference) is *not* multiplication.

### 3.2 Integer division and modulo
- Both operands integers → **integer division**; either operand floating → floating division.
- Result is **truncated toward zero** (C99): `-7 / 2 = -3`.
- `a % b` has the **sign of the dividend**: `-7 % 2 = -1`, `7 % -2 = 1`, and `(a/b)*b + a%b == a` always.
- `a % 1 == 0`; for positive operands `0 <= a % b < b`.

### 3.3 `!`, relational and logical operators
- `!x` is 1 if x is 0 else 0 (so `!5 == 0`, `!!5 == 1`). Result of `! < > == != && ||` is always **0 or 1** (type `int`).
- Truth: `0` is false, **any non-zero is true**.
- Relational operators **do not chain**: `a < b < c` means `(a < b) < c` — compares 0/1 with c. So `3 > 2 > 1` is `1 > 1` = 0.

### 3.4 Short-circuit evaluation
- `A && B`: if A is false, B is **not evaluated**.
- `A || B`: if A is true, B is **not evaluated**.
- `&&` binds tighter than `||`: `a || b && c` = `a || (b && c)`.
- There is a sequence point after the left operand of `&&`, `||`, `?:` and `,`, so side effects there are well-defined.

### 3.5 Assignment operators
`=  +=  -=  *=  /=  %=  <<=  >>=  &=  ^=  |=`
- Assignment is an **expression** whose value is the assigned value: `y = (x = 10)` gives both 10.
- `x op= y` is `x = x op (y)` — the **whole right side** is grouped: `x *= 2 + 3` is `x = x * (2+3)`.
- Right-to-left: `a = b = c = 5`.
- `x /= 5` with ints is integer division.

### 3.6 Increment / decrement
- `++x` (pre): increment, then use the new value. `x++` (post): use the old value, increment afterwards.
- Modifying the same object twice (or modifying and reading it) between sequence points is **undefined** (see Chapter 6).
- The operand must be a modifiable lvalue: `5++`, `(a+b)++`, `++(x++)` are errors.

### 3.7 Conditional (ternary) operator `?:`
`cond ? e1 : e2` evaluates `cond`, then **only one** of `e1`/`e2`. Right-associative:
`a ? b : c ? d : e` = `a ? b : (c ? d : e)`.

### 3.8 Comma operator
Evaluates left → right, value is the **rightmost** expression. Lowest precedence: `a = 1, 2;` is `(a = 1), 2;` → a = 1. Commas separating function arguments or declarators are **not** comma operators.

### 3.9 `sizeof`
- Unary operator (not a function), result type `size_t`, measured in bytes.
- Operand is **not evaluated** (except variable-length arrays): `sizeof(i++)` does not change `i`.
- `sizeof(char) == 1` always. `sizeof(array)` = whole array; `sizeof(pointer)` = pointer size; `sizeof(*p)` = size of the pointed-to type.

### Practice Questions — Chapter 3  *(13 questions, 17 marks)*

**Q3.1**  `Output · 1M`  What is the output?

```c
int main() {
    int a = 2, b = 3, c = 4;
    printf("%d", a + b * c % 3);
}
```

**Q3.2**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d %d %d", -7 / 2, -7 % 2, 7 % -2);
}
```

**Q3.3**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 7 / 2 * 2.0;
    printf("%d", x);
}
```

**Q3.4**  `Output · 2M`  What is the output?

```c
int main() {
    int i = 0, j = 0, k = 0;
    if (i++ || j++ && k++) { }
    printf("%d %d %d", i, j, k);
}
```

**Q3.5**  `Output · 1M`  What is the output?

```c
int main() {
    int a = 5, b = 10;
    printf("%d", a > b ? a : b > 7 ? 100 : 200);
}
```

**Q3.6**  `Output · 1M`  What is the output?

```c
int main() {
    int a, b;
    a = 1, 2;
    b = (1, 2);
    printf("%d %d", a, b);
}
```

**Q3.7**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d %d", 3 > 2 > 1, 1 < 2 < 3);
}
```

**Q3.8**  `Output · 2M`  What is the output?

```c
int main() {
    int x = 4;
    if (x & 1 == 0) printf("EVEN");
    else            printf("ODD");
}
```

**Q3.9**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 10;
    x *= 2 + 3;
    x -= 4 % 3;
    printf("%d", x);
}
```

**Q3.10**  `Output · 2M`  What is the output?

```c
int main() {
    int a = 5, b = 3;
    int c = a+++b;
    printf("%d %d %d", a, b, c);
}
```

**Q3.11**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 5;
    printf("%zu %d", sizeof(i++), i);
}
```

**Q3.12**  `Output · 2M`  What is the output?

```c
int main() {
    int a, b, c;
    a = b = c = 5;
    a += b -= c *= 2;
    printf("%d %d %d", a, b, c);
}
```

**Q3.13**  `NAT · 1M`  The value of `!5 + !0 + !!7` is ______.

### Answer Key — Chapter 3

- **3.1** — Output: `2` ✅ — `b*c = 12`, `12 % 3 = 0` (same level, L→R), `a + 0 = 2`.
- **3.2** — Output: `-3 -1 1` ✅ — Division truncates toward zero; `%` takes the sign of the dividend: −7%2 = −1, 7%−2 = 1.
- **3.3** — Output: `6` ✅ — `7/2 = 3` (integer), `3 * 2.0 = 6.0`, converted to int 6.
- **3.4** — Output: `1 1 0` ✅ — `&&` binds tighter: `i++ || (j++ && k++)`. `i++` is 0 (false) → evaluate `j++ && k++`; `j++` is 0 → `k++` is skipped. So i=1, j=1, k=0.
- **3.5** — Output: `100` ✅ — Right-associative: `a>b ? a : (b>7 ? 100 : 200)`. `5>10` is false, `10>7` is true → 100.
- **3.6** — Output: `1 2` ✅ — `a = 1, 2;` parses as `(a = 1), 2;` since `=` has higher precedence than `,`. `b = (1,2)` takes the rightmost value 2.
- **3.7** — Output: `0 1` ✅ — `3>2>1` = `(1)>1` = 0. `1<2<3` = `(1)<3` = 1.
- **3.8** — Output: `ODD` ✅ — `1 == 0` is evaluated first (0), so the test is `x & 0` = 0 → false → prints ODD even though x is even.
- **3.9** — Output: `49` ✅ — `x *= 2+3` → x = 10*5 = 50; `x -= 4%3` → 50 − 1 = 49.
- **3.10** — Output: `6 3 8` ✅ — Maximal munch: `a++ + b` = 5 + 3 = 8; then a becomes 6.
- **3.11** — Output: `4 5` ✅ — `sizeof` does not evaluate its operand, so `i` stays 5 (type `int` → 4 bytes).
- **3.12** — Output: `0 -5 10` ✅ — Right-to-left: `c *= 2` → c=10; `b -= 10` → b=−5; `a += −5` → a=0.
- **3.13** — **2** — 0 + 1 + 1 = 2.


---

## Chapter 4 — Type Conversion, Promotion and Casting


### 4.1 Implicit conversion
The compiler converts types automatically in assignments and expressions.
```c
int a = 5;  float b = a;   // int → float
```

### 4.2 Explicit cast
`(type) expression`. A cast has **higher precedence than `/`** and **does not change the variable**, only the value of that expression.
```c
(int)(7.8/2)  // 3.9 → 3
(int)7.8/2    // 7/2 → 3   (cast applies to 7.8 only)
```

### 4.3 Integer promotion
In expressions, `char`, `short` (and `_Bool`, bit-fields) are first promoted to `int` (or `unsigned int` if `int` cannot hold all values).
```c
char a = 100, b = 100;
a + b      // int 200 — no overflow of char during the addition
sizeof(a+b) // 4
```
Promotion also affects bitwise operators: for `unsigned char c = 0xF0;`, `~c` is `~(int)240 = -241`.

### 4.4 Usual arithmetic conversions (for binary operators)
1. Promote both operands (integer promotion).
2. If one is `long double` → both `long double`; else `double`; else `float`.
3. Otherwise (both integer): if types are same, done; if signedness matches, convert to the type with greater rank; if the **unsigned** operand has rank ≥ signed operand, convert to unsigned; etc.

Quick ladder: `int < unsigned int < long < unsigned long < long long < unsigned long long < float < double < long double`.

**Rule of thumb:** *signed + unsigned of the same size → unsigned*. So `-1 < 0u` is **false** (−1 becomes `UINT_MAX`).

### 4.5 Float ↔ int
- Float → int: **truncation toward zero** (`7.8 → 7`, `−7.8 → −7`, never rounds). If the value does not fit, UB.
- Int → float: may lose precision for large values.
- `float x = 5/2;` → `5/2 = 2` first, then `x = 2.0` (not 2.5).

### 4.6 Types of constants
`1` int, `1L` long, `1U` unsigned, `1.0` double, `1.0f` float, `'a'` **int**, `"a"` `char[2]`.

> The type of an expression matters as much as its value.

### Practice Questions — Chapter 4  *(12 questions, 16 marks)*

**Q4.1**  `Output · 1M`  What is the output?

```c
int main() {
    float x = 5 / 2;
    printf("%.1f", x);
}
```

**Q4.2**  `Output · 1M`  What is the output?

```c
int main() {
    char a = 100, b = 100;
    printf("%d %zu", a + b, sizeof(a + b));
}
```

**Q4.3**  `Output · 2M`  What is the output?

```c
int main() {
    printf("%d %d", (int)(7.8 / 2), (int)7.8 / 2 * 2);
}
```

**Q4.4**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%.1f", 1/2 + 1/2.0);
}
```

**Q4.5**  `Output · 2M`  What is the output? (64-bit `long long`)

```c
int main() {
    int a = 100000;
    long long b = (long long)a * a;
    printf("%lld", b);
}
```

**Q4.6**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d %d", (int)-3.9, (int)(-3.9 + 0.5));
}
```

**Q4.7**  `Output · 1M`  On a typical 64-bit Linux machine (int 4, long 8, float 4, double 8), the output is:

```c
int main() {
    printf("%zu %zu %zu %zu", sizeof('A'), sizeof(1.5), sizeof(1.5f), sizeof(1L));
}
```

**Q4.8**  `Output · 2M`  What is the output?

```c
int main() {
    if (-1 < 0u) printf("yes");
    else         printf("no");
}
```

**Q4.9**  `Output · 2M`  What is the output? (32-bit int)

```c
int main() {
    unsigned char c = 0xF0;
    printf("%d %d", ~c, (unsigned char)~c);
}
```

**Q4.10**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 3.99;
    float f = 7/2 + 7/2.0;
    printf("%d %.1f", i, f);
}
```

**Q4.11**  `Output · 1M`  What is the output?

```c
int main() {
    char c = 'a' + 1;
    printf("%c %d", c, c);
}
```

**Q4.12**  `MCQ · 1M`  What is the type of the expression `'a' + 1L + 2.0f`?

- (A) int
- (B) long
- (C) float
- (D) double

### Answer Key — Chapter 4

- **4.1** — Output: `2.0` ✅ — Integer division happens first: 5/2 = 2; then converted to 2.0.
- **4.2** — Output: `200 4` ✅ — `a` and `b` are promoted to int before `+`; result is int 200 and `sizeof(int)` = 4.
- **4.3** — Output: `3 6` ✅ — `(int)(3.9) = 3`. In the second, `(int)7.8 = 7`, `7/2 = 3`, `3*2 = 6`.
- **4.4** — Output: `0.5` ✅ — `1/2 = 0` (int division), `1/2.0 = 0.5`; sum 0.5.
- **4.5** — Output: `10000000000` ✅ — The cast is applied to `a` first, so the multiplication is done in `long long`. Without the cast, `a*a` would overflow `int` (UB).
- **4.6** — Output: `-3 -3` ✅ — Truncation toward zero: −3.9 → −3; −3.4 → −3.
- **4.7** — Output: `4 8 4 8` ✅ — `'A'` is int (4), `1.5` double (8), `1.5f` float (4), `1L` long (8).
- **4.8** — Output: `no` ✅ — `-1` is converted to `unsigned int` (UINT_MAX) which is not less than 0.
- **4.9** — Output: `-241 15` ✅ — `c` promotes to int 240; `~240 = −241`. Casting `~c` back to `unsigned char` keeps the low 8 bits: 0x0F = 15.
- **4.10** — Output: `3 6.5` ✅ — Assigning 3.99 to int truncates to 3. `7/2 = 3`, `7/2.0 = 3.5` → 6.5.
- **4.11** — Output: `b 98` ✅ — `'a'` = 97; +1 = 98 = `'b'`.
- **4.12** — **(C)** — `'a'` → int; `int + long` → long; `long + float` → float (any floating type outranks any integer type). `2.0f` is float, not double.


---

## Chapter 5 — Bitwise Operators and Bit Manipulation


### 5.1 The six bitwise operators
| Op | Name | Rule |
|---|---|---|
| `&` | AND | 1 only if both bits are 1 |
| `\|` | OR | 0 only if both bits are 0 |
| `^` | XOR | 1 if bits **differ** |
| `~` | NOT | flips every bit; `~x = −x − 1` (two's complement) |
| `<<` | left shift | fills with 0s on the right |
| `>>` | right shift | unsigned → zeros come in; negative signed → implementation-defined |

Do not confuse `&`/`|`/`~` with `&&`/`||`/`!`.

Examples: `5 & 3 = 1`, `5 | 3 = 7`, `5 ^ 3 = 6`, `~5 = −6`, `~(−5) = 4`, `5 << 2 = 20`, `20 >> 2 = 5`.

### 5.2 Shift facts
- For non-negative values without overflow: `x << n = x × 2ⁿ`, `x >> n = ⌊x / 2ⁿ⌋`.
- Shifting by a count **≥ width of the (promoted) type**, or by a negative count, is **UB**.
- Left-shifting a signed value into/over the sign bit is UB (use `1u << 31`).

### 5.3 Identities
```
x & 0 = 0    x | 0 = x    x ^ 0 = x
x & x = x    x | x = x    x ^ x = 0
x ^ x ^ x = x     a ^ b ^ a = b
a + b = (a ^ b) + 2*(a & b) = (a | b) + (a & b)
```

### 5.4 Essential bit tricks
| Task | Code |
|---|---|
| Test bit k | `(x >> k) & 1` or `x & (1<<k)` |
| Set bit k | `x \|= (1 << k)` |
| Clear bit k | `x &= ~(1 << k)` |
| Toggle bit k | `x ^= (1 << k)` |
| Is odd? | `x & 1` |
| Clear lowest set bit | `x & (x − 1)` |
| Isolate lowest set bit | `x & −x` |
| Power of two (x>0) | `(x & (x − 1)) == 0` |
| Count set bits (Kernighan) | `while (x) { x &= x−1; c++; }` — loops once per set bit |
| Swap without temp | `a ^= b; b ^= a; a ^= b;` (fails if both refer to the same object) |
| Multiply/divide by 2ⁿ | `x << n` / `x >> n` |
| Lowercase ↔ uppercase | `c ^ 32`, `c \| 32`, `c & ~32` (ASCII letters) |

### 5.5 Promotion warning
Operands smaller than `int` are promoted first, so `~c` for `unsigned char c` is a negative int; mask or cast back when needed.

### Practice Questions — Chapter 5  *(13 questions, 15 marks)*

**Q5.1**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%d %d %d %d", 5 & 3, 5 | 3, 5 ^ 3, ~5);
}
```

**Q5.2**  `Output · 2M`  What is the value printed?

```c
int main() {
    unsigned int x = 181;   // 10110101
    int c = 0;
    while (x) { x = x & (x - 1); c++; }
    printf("%d", c);
}
```

**Q5.3**  `Output · 1M`  What is the output?

```c
int main() {
    int a = 5, b = 9;
    a ^= b; b ^= a; a ^= b;
    printf("%d %d", a, b);
}
```

**Q5.4**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 12;
    printf("%d", x & -x);
}
```

**Q5.5**  `Output · 1M`  What is the output? (32-bit int)

```c
int main() {
    printf("%u", 1u << 31);
}
```

**Q5.6**  `Output · 1M`  What is the output? (32-bit int)

```c
int main() {
    printf("%d %u", ~0, ~0u);
}
```

**Q5.7**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 0x0F;
    printf("%d", (x << 4) | (x >> 4));
}
```

**Q5.8**  `NAT · 1M`  How many integers x in the range 1..100 satisfy `(x & (x - 1)) == 0`?

**Q5.9**  `Output · 2M`  What are the three values printed?

```c
int main() {
    int x = 10;          // 1010
    x ^= (1 << 2);  printf("%d ", x);
    x |= 1;         printf("%d ", x);
    x &= ~(1 << 3); printf("%d", x);
}
```

**Q5.10**  `MCQ · 1M`  What does `f` compute for non-negative `x`?

```c
int f(unsigned x) {
    int c = 0;
    while (x) { c += x & 1; x >>= 1; }
    return c;
}
```

- (A) Number of bits in x
- (B) Number of 1-bits in x
- (C) Position of the highest set bit
- (D) x mod 2

**Q5.11**  `NAT · 1M`  The value of `5 ^ 3 ^ 5` is ______.

**Q5.12**  `Output · 1M`  What is the output?

```c
int main() {
    unsigned int x = 0x80000000;
    printf("%u", x >> 31);
}
```

**Q5.13**  `NAT · 1M`  For `a = 12`, `b = 10`, the value of `(a & b) * 2 + (a ^ b)` is ______.

### Answer Key — Chapter 5

- **5.1** — Output: `1 7 6 -6` ✅ — 101 & 011 = 001; 101 | 011 = 111; 101 ^ 011 = 110; ~5 = −6.
- **5.2** — Output: `5` ✅ — Each iteration clears the lowest set bit, so the loop runs once per 1-bit. 181 = 10110101 has five 1s.
- **5.3** — Output: `9 5` ✅ — XOR swap: a=5^9=12, b=9^12=5, a=12^5=9.
- **5.4** — Output: `4` ✅ — `x & −x` isolates the lowest set bit; 12 = 1100 → 0100 = 4.
- **5.5** — Output: `2147483648` ✅ — Using `1u` avoids signed-overflow UB; bit 31 set = 2³¹.
- **5.6** — Output: `-1 4294967295` ✅ — `~0` flips all bits: all ones is −1 in two's complement and UINT_MAX when unsigned.
- **5.7** — Output: `240` ✅ — `0x0F << 4 = 0xF0`, `0x0F >> 4 = 0`; OR = 0xF0 = 240.
- **5.8** — **7** — Powers of two in range: 1, 2, 4, 8, 16, 32, 64.
- **5.9** — Output: `14 15 7` ✅ — 1010 ^ 0100 = 1110 (14); | 0001 = 1111 (15); & ~1000 = 0111 (7).
- **5.10** — **(B)** — It adds the LSB each time and shifts right: a population count. (Check: f(255) = 8).
- **5.11** — **3** — XOR is associative/commutative and `a ^ a = 0`: 5^5^3 = 0^3 = 3.
- **5.12** — Output: `1` ✅ — For unsigned values `>>` is a logical shift: the top bit moves to bit 0.
- **5.13** — **22** — `a + b = 2(a&b) + (a^b)`: (8)·2 + 6 = 22 = 12 + 10.


---

## Chapter 6 — Undefined, Unspecified and Implementation-Defined Behaviour; Sequence Points


**Before computing any output, ask: "Is this code even well-defined?"**

### 6.1 The three categories
| Category | Meaning | Examples |
|---|---|---|
| **Undefined behaviour (UB)** | The standard imposes **no** requirements; anything may happen | signed overflow, out-of-bounds access, NULL dereference, use after `free`, modifying an object twice without a sequence point, division by zero (integers), shifting by ≥ width, modifying a string literal, reading an uninitialized *automatic* variable (indeterminate value) |
| **Unspecified behaviour** | Several outcomes allowed; implementation need **not** document which | order of evaluation of function arguments, order of evaluation of operands of `+`, `f() + g()` |
| **Implementation-defined** | Implementation picks one outcome and **documents** it | `sizeof(int)`, signedness of plain `char`, right shift of negative signed values, signed conversion of an out-of-range value |

`undefined ≠ unspecified ≠ implementation-defined`. When you spot UB: **STOP calculating** — the answer is "undefined / compiler dependent / no deterministic output".

### 6.2 Sequence points (summary)
A *sequence point* is a point where all earlier side effects are complete and no later ones have begun. They occur:
- at the end of a **full expression** (`;`, the controlling expression of `if/while/for/switch`, `return` expression)
- after the first operand of `&&`, `||`, `?:`, and `,` (the comma **operator**)
- after all arguments of a function call have been evaluated (before the call), and at function return

Between two sequence points an object may be modified **at most once**, and if it is modified, its prior value may be read **only to determine the new value**. Otherwise → UB.

| Expression | Verdict |
|---|---|
| `i = i++;` `i = i++ + ++i;` `a[i] = i++;` `i++ + i++;` | UB |
| `printf("%d %d", i++, i++);` | UB / unspecified order — no portable answer |
| `i++ && i++` | defined (sequence point at `&&`) |
| `(i++, i++)` | defined (comma operator) |
| `x = (y = 5) + 1;` | defined |
| `f() + g()` | defined but **order of calls unspecified** |

### 6.3 Evaluation order
Never assume left-to-right for operands of `+ - * / == &` or for function arguments. Only `&&`, `||`, `?:` and `,` guarantee left-to-right.

### 6.4 Quick UB list for GATE
1. Array index out of bounds (including writing `a[n]`). *Forming* the one-past-the-end pointer is fine; dereferencing it is UB.
2. Dereferencing NULL / wild / dangling pointer.
3. Signed integer overflow (`INT_MAX + 1`).
4. Integer division by zero (`x / 0`, `x % 0`).
5. Unsequenced modification of a scalar.
6. Using an indeterminate (uninitialized local) value.
7. Modifying a string literal or a `const` object through a cast.
8. `free()` of a pointer not from `malloc`, or double free.
9. Mismatched `printf` format specifier / missing arguments.
10. Shifts with a count ≥ width or negative.
11. Reading a **global/static** variable that was not initialized → *well-defined* (it is 0).

### Practice Questions — Chapter 6  *(9 questions, 13 marks)*

**Q6.1**  `MCQ · 1M`  Which of the following is **correctly** classified?

- (A) Signed integer overflow — implementation-defined
- (B) Right shift of a negative signed int — undefined
- (C) Order of evaluation of function arguments — unspecified
- (D) `sizeof(int)` — undefined

**Q6.2**  `MCQ · 2M`  After `int i = 5; i = i++ + ++i;` the value of `i` is:

- (A) 12
- (B) 13
- (C) 14
- (D) Undefined — no portable answer

**Q6.3**  `MCQ · 1M`  Which of the following expressions has **well-defined** behaviour (`int x = 0, a[5];`)?

- (A) `x = x++;`
- (B) `x = x++ + x++;`
- (C) `x++ && x++;`
- (D) `a[x] = x++;`

**Q6.4**  `MCQ · 1M`  Which of the following is **NOT** undefined behaviour?

- (A) Accessing `a[5]` where `int a[5];`
- (B) Reading an uninitialized *global* `int g;`
- (C) `INT_MAX + 1`
- (D) Calling `free(p)` twice on the same `p`

**Q6.5**  `Output · 2M`  What is the output?

```c
int main() {
    int i = 1;
    int r = (i++, i++) + 0;
    printf("%d %d", r, i);
}
```

**Q6.6**  `MCQ · 2M`  In `int a = f() + g();` where `f` prints 'F' and `g` prints 'G', the possible output(s):

- (A) Always FG
- (B) Always GF
- (C) FG or GF — compiler dependent
- (D) Undefined behaviour

**Q6.7**  `MCQ · 1M`  `printf("%d", 5 / 0);` — what does the C standard say?

- (A) Prints 0
- (B) Prints infinity
- (C) Undefined behaviour
- (D) Implementation-defined

**Q6.8**  `Output · 2M`  Which of the following is guaranteed to print `5`?

```c
int x = 5;
// (A) printf("%d", x++ + x);
// (B) printf("%d", x == 5 ? x : 0);
// (C) printf("%d", x = x++);
// (D) printf("%d %d", x, x++);
```

**Q6.9**  `MCQ · 1M`  State TRUE or FALSE: "If a program contains undefined behaviour, the C standard guarantees the program will crash."

- (A) TRUE
- (B) FALSE

### Answer Key — Chapter 6

- **6.1** — **(C)** — (A) is UB, (B) is implementation-defined, (D) is implementation-defined.
- **6.2** — **(D)** — `i` is modified twice between sequence points → UB. Never pick a number.
- **6.3** — **(C)** — `&&` introduces a sequence point after its left operand. (A), (B), (D) modify and read `x` unsequenced.
- **6.4** — **(B)** — Objects with static storage duration are zero-initialized, so reading them is fine.
- **6.5** — Output: `2 3` ✅ — Comma operator: first `i++` yields 1 (i=2), second `i++` yields 2 (i=3). Value of the comma expression is 2.
- **6.6** — **(C)** — Order of evaluation of operands of `+` is unspecified. The calls do not overlap (function calls are indeterminately sequenced), so it is *not* UB — just unspecified.
- **6.7** — **(C)** — Integer division by zero is UB. (Floating division by zero is separately defined by IEEE-754 on most platforms.)
- **6.8** — **(B)** — (A), (C), (D) read/modify `x` unsequenced → UB. In (B) `x == 5` is the first operand of `?:` (sequence point) and only `x` is read afterwards → prints 5.
- **6.9** — **(B)** — UB means *no* guarantees at all — it may crash, print garbage, appear to work, or be optimized away.


---

## Chapter 7 — Control Flow: if, switch, Loops, break, continue, goto


### 7.1 `if` / `if-else`
```c
if (cond) stmt1; else stmt2;
```
- Condition is any scalar: **0 = false, non-zero = true** (`if (-10)` is true).
- `if (x = 5)` is an **assignment** (always true here), not a comparison.
- **Dangling else:** `else` binds to the **nearest** unmatched `if`, regardless of indentation.
- A stray `;` after `if (...)`, `for (...)`, `while (...)` makes an empty body.

### 7.2 `switch`
```c
switch (expr) {          // expr must be an integer type (int, char, enum…), not float
    case 1: ...; break;  // case labels must be integer CONSTANT expressions, distinct
    default: ...;        // can appear anywhere; executed only if no case matches
}
```
- **No automatic `break`** → execution **falls through** into later cases (including `default` if it follows).
- If no case matches and there is a `default` in the middle, execution starts there and continues downward.
- `break` leaves the `switch`; `continue` inside a switch applies to the enclosing loop.

### 7.3 Loops
| Loop | Test | Minimum executions |
|---|---|---|
| `for (init; cond; update)` | before body | 0 |
| `while (cond)` | before body | 0 |
| `do { } while (cond);` | after body | **1** |

`for` order: `init → cond → body → update → cond → body → …`. Any of the three parts may be empty; `for(;;)` is an infinite loop (empty condition = true).

### 7.4 `break` and `continue`
- `break`: exits the **nearest** enclosing loop or switch only.
- `continue`: skips the rest of the current iteration. In a `for` loop the **update expression still runs**; in `while`/`do-while` control goes to the condition test.

### 7.5 `goto`
`goto label;` jumps to `label:` in the same function. Legal but rarely used; jumping into the scope of a variable-length array is invalid.

### 7.6 Counting loop iterations (very common in GATE)
| Pattern | Executions of body |
|---|---|
| `for (i=0; i<n; i++)` | n |
| `for (i=0; i<n; i+=k)` | ⌈n/k⌉ |
| `for (i=1; i<=n; i*=2)` | ⌊log₂ n⌋ + 1 |
| `for (i=n; i>0; i/=2)` | ⌊log₂ n⌋ + 1 |
| nested `for i<n { for j<n }` | n² |
| `for i<n { for j<i }` | n(n−1)/2 |
| `for (i=1;i<=n;i*=2) for (j=0;j<i;j++)` | 1+2+4+…≤n ≈ 2n−1 for n a power of 2 |

**Floating-point loop counters** (e.g. `for (f=0; f!=1.0; f+=0.1)`) may never hit the exact value → infinite loop.

### Practice Questions — Chapter 7  *(11 questions, 16 marks)*

**Q7.1**  `Output · 1M`  What is the output?

```c
int main() {
    switch (2) {
        case 1: printf("1");
        case 2: printf("2");
        case 3: printf("3"); break;
        default: printf("D");
    }
}
```

**Q7.2**  `Output · 2M`  What is the output?

```c
int main() {
    switch (5) {
        default: printf("D");
        case 1:  printf("1"); break;
        case 2:  printf("2");
    }
}
```

**Q7.3**  `Output · 1M`  What is the output?

```c
int main() {
    int i;
    for (i = 0; i < 5; i++) {
        if (i == 2) continue;
        printf("%d", i);
    }
}
```

**Q7.4**  `Output · 1M`  What is the output?

```c
int main() {
    int i;
    for (i = 0; i < 3; i++);
    printf("%d", i);
}
```

**Q7.5**  `NAT · 2M`  The value of `cnt` printed is ______.

```c
int main() {
    int i, j, cnt = 0;
    for (i = 1; i <= 16; i *= 2)
        for (j = 0; j < i; j++)
            cnt++;
    printf("%d", cnt);
}
```

**Q7.6**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 3;
    while (i--) printf("%d", i);
}
```

**Q7.7**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 10;
    do { printf("%d", i); } while (i < 5);
}
```

**Q7.8**  `Output · 1M`  What is the output?

```c
int main() {
    int a = 1, b = 0;
    if (a)
        if (b) printf("X");
        else   printf("Y");
}
```

**Q7.9**  `NAT · 2M`  Numbers in 1..100 divisible by 3 **or** 5: the final value of `cnt` is ______.

```c
int main() {
    int i, cnt = 0;
    for (i = 1; i <= 100; i++)
        if (i % 3 == 0 || i % 5 == 0) cnt++;
    printf("%d", cnt);
}
```

**Q7.10**  `Output · 2M`  What is the output?

```c
int main() {
    int i = 0, x = 0;
    for (;;) {
        if (++i > 5) break;
        if (i % 2) continue;
        x += i;
    }
    printf("%d", x);
}
```

**Q7.11**  `NAT · 2M`  Why is this loop a bad idea, and what is printed? (the guard `n < 20` is only a safety net)

```c
int main() {
    float f; int n = 0;
    for (f = 0.0f; f != 1.0f && n < 20; f += 0.1f) n++;
    printf("%d", n);
}
```

### Answer Key — Chapter 7

- **7.1** — Output: `23` ✅ — Matches `case 2`, then falls through `case 3` until `break`.
- **7.2** — Output: `D1` ✅ — No case matches 5 → jump to `default`, which falls through into `case 1` and stops at its `break`.
- **7.3** — Output: `0134` ✅ — `continue` skips only the print for i=2; `i++` still executes.
- **7.4** — Output: `3` ✅ — The stray `;` makes the body empty; after the loop `i` = 3.
- **7.5** — Output: `31` ✅ — i = 1,2,4,8,16 → inner runs 1+2+4+8+16 = 31 times.
- **7.6** — Output: `210` ✅ — Test uses the old value, then decrements: tests 3,2,1 pass (prints 2,1,0), test 0 fails.
- **7.7** — Output: `10` ✅ — `do-while` executes its body once before testing.
- **7.8** — Output: `Y` ✅ — `else` pairs with the nearest `if (b)`. Since a=1 and b=0, prints Y.
- **7.9** — Output: `47` ✅ — 33 + 20 − 6 (multiples of 15) = 47.
- **7.10** — Output: `6` ✅ — Even i in 1..5: 2 + 4 = 6; the loop breaks at i = 6.
- **7.11** — **20** ✅ — Adding 0.1f ten times gives about 1.0000001, never exactly 1.0f, so `f != 1.0f` never becomes false and only the guard stops the loop. Never use `==`/`!=` on floating counters.


---

## Chapter 8 — Input / Output: printf, scanf and Friends


### 8.1 `printf` format specifiers
| Spec | Type | Spec | Type |
|---|---|---|---|
| `%d` / `%i` | `int` | `%u` | `unsigned int` |
| `%ld` / `%lld` | `long` / `long long` | `%lu` / `%zu` | `unsigned long` / `size_t` |
| `%f` | `double` (default 6 decimals) | `%e` / `%g` | scientific / shortest |
| `%c` | `char` (as character) | `%s` | `char *` string |
| `%x` / `%X` | unsigned hex | `%o` | unsigned octal |
| `%p` | pointer (`void *`) | `%%` | a literal `%` |

**Field options:** `%5d` (width 5, right-aligned), `%-5d` (left-aligned), `%05d` (zero-padded), `%.2f` (2 decimals), `%.3s` (at most 3 chars of a string), `%*d` (width taken from an argument).

- **`printf` returns the number of characters printed** (negative on error): `printf("%d", printf("123"))` prints `1233`.
- Using the wrong specifier or passing too few arguments is **UB**.
- `%d` with `'A'` prints 65; `%c` with 65 prints `A`; `%u` with `−1` prints `4294967295` (32-bit).
- `puts(s)` appends a newline; `putchar(c)` prints one char.

### 8.2 `scanf`
- Needs **addresses**: `scanf("%d", &x);`. For arrays of char, the array name already decays to an address: `scanf("%19s", s);` (no `&`).
- `%d %f %c %s`: for `double` use **`%lf`** in `scanf` (but `%f` in `printf`); `%f` in scanf expects `float *`.
- `%s` stops at whitespace; `%c` reads **one character including whitespace/newline** — the classic trap after `scanf("%d")` leaves the `'\n'` in the buffer. Use `" %c"` (leading space) to skip whitespace.
- **Return value:** number of items successfully assigned (or `EOF`). `scanf("%d%d", &a, &b)` returns 2 when both are read.
- `%*d` reads and **discards** an integer; `%3d` reads at most 3 characters.

### 8.3 Character I/O
`getchar()`, `putchar()`, `fgetc/fputc`, `gets` (removed in C11 — unsafe), `fgets(buf, n, fp)` reads at most n−1 chars and keeps the `'\n'`.
`getchar()` returns **`int`** so that `EOF` (−1) can be distinguished from valid chars.

### Practice Questions — Chapter 8  *(10 questions, 13 marks)*

**Q8.1**  `Output · 2M`  What is the output?

```c
int main() {
    printf("%d", printf("%d", 123));
}
```

**Q8.2**  `Output · 1M`  What is the output? (shown with `|` separators)

```c
int main() {
    printf("%5d|%-5d|%05d", 42, 42, 42);
}
```

**Q8.3**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%.2f %x %o %c %.3s", 3.14159, 255, 8, 65, "GATE2027");
}
```

**Q8.4**  `Output · 1M`  What is the output?

```c
int main() {
    printf("%s|%d|%c", "GATE" + 1, '0', "abc"[1]);
}
```

**Q8.5**  `Output · 1M`  Input is `10 20`. What is printed?

```c
int main() {
    int a, b;
    int n = scanf("%d %d", &a, &b);
    printf("%d %d", n, a + b);
}
```

**Q8.6**  `Output · 2M`  Input is the two lines `5` and `A`. What is printed?

```c
int main() {
    int n; char c;
    scanf("%d", &n);
    scanf("%c", &c);
    printf("%d", c);
}
```

**Q8.7**  `Output · 2M`  Input is `abc`. What does the program print?

```c
int main() {
    int x = 99;
    int r = scanf("%d", &x);
    printf("%d %d", r, x);
}
```

**Q8.8**  `Output · 1M`  What is the output? (32-bit `int`)

```c
int main() {
    printf("%u %d", -1, 077);
}
```

**Q8.9**  `MCQ · 1M`  Which statement about `scanf("%s", s)` with `char s[20];` is correct?

- (A) It needs `&s`
- (B) It reads a whole line including spaces
- (C) It stops at the first whitespace and can overflow `s` for long input
- (D) It returns the string length

**Q8.10**  `MCQ · 1M`  In `scanf`, to read a `double` you must use:

- (A) `%f`
- (B) `%lf`
- (C) `%d`
- (D) `%e` only

### Answer Key — Chapter 8

- **8.1** — Output: `1233` ✅ — The inner `printf` prints `123` and returns 3; the outer then prints `3`.
- **8.2** — Output: `   42|42   |00042` ✅ — Width 5 right-justified, left-justified, and zero-padded.
- **8.3** — Output: `3.14 ff 10 A GAT` ✅ — Two decimals, hex of 255 = ff, octal of 8 = 10, char 65 = A, at most 3 chars of the string.
- **8.4** — Output: `ATE|48|b` ✅ — `"GATE"+1` points to `ATE`. `'0'` is ASCII 48. `"abc"[1]` is `'b'`.
- **8.5** — Output: `2 30` ✅ — `scanf` returns the number of successful conversions = 2.
- **8.6** — Output: `10` ✅ — `%d` leaves the newline in the buffer; `%c` reads that `'\n'` (ASCII 10), not `'A'`. Fix: `scanf(" %c", &c)`.
- **8.7** — Output: `0 99` ✅ — No conversion succeeds: `scanf` returns 0 and leaves `x` untouched.
- **8.8** — Output: `4294967295 63` ✅ — −1 reinterpreted as unsigned; `077` is octal 63.
- **8.9** — **(C)** — `s` already decays to `char *`; `%s` stops at whitespace; no bounds check unless a width is given (`%19s`).
- **8.10** — **(B)** — `scanf` `%f` stores a `float`; `%lf` stores a `double`. (`printf` uses `%f` for both because floats are promoted to double.)


---

## Chapter 9 — Functions, Parameter Passing and Recursion


### 9.1 Declaration, definition, call
```c
int add(int, int);              // declaration / prototype
int add(int a, int b) { return a + b; }   // definition
x = add(2, 3);                  // call
```
- A function must be declared before use (C99+); in old C an undeclared function is assumed to return `int`.
- `void f(void)` = no parameters; `void f()` = *unspecified* parameters in old C.
- Return type `void` → no value. Falling off the end of a non-void function and using the result is UB.

### 9.2 Everything in C is pass-by-value
```c
void f(int x)  { x = 100; }       // caller's variable unchanged
void g(int *p) { *p = 100; }      // g(&x) changes x ... but the pointer itself is still a COPY
```
- To modify the caller's *pointer* you need a pointer to pointer (`int **`).
- **Arrays** are passed as pointers to their first element: `void f(int a[])` ≡ `void f(int *a)`, so `sizeof(a)` inside is the size of a **pointer**. Changes to elements are visible to the caller.
- **Structures** are passed (and returned) by value — the whole struct is copied (arrays inside it are copied too).

### 9.3 Recursion
Every recursive function needs a **base case** and a **recursive case** that progresses toward it. Each active call has its own **stack frame** (parameters, locals, return address) → space cost = depth.

| Recurrence | Time |
|---|---|
| `T(n) = T(n−1) + O(1)` | O(n) |
| `T(n) = T(n−1) + O(n)` | O(n²) |
| `T(n) = 2T(n−1) + O(1)` | O(2ⁿ) |
| `T(n) = T(n/2) + O(1)` | O(log n) |
| `T(n) = 2T(n/2) + O(n)` | O(n log n) |
| `T(n) = T(n−1) + T(n−2) + O(1)` | O(φⁿ) ≈ O(1.618ⁿ) |

**Tracing technique:** write each call with its arguments; record what is printed *before* the recursive call (pre-order) and *after* it (post-order) separately.

- Tail recursion: the recursive call is the last action (no pending work); compilers may reuse the frame, but C does **not** guarantee tail-call optimization.
- Missing/unreachable base case → infinite recursion → stack overflow.

**Number of calls** for naive Fibonacci with base cases `f(0)=f(1)=1`: `C(n) = 1 + C(n−1) + C(n−2)`, C(0)=C(1)=1 → 1, 1, 3, 5, 9, 15, 25 …

### 9.3a Famous recursive functions
- Factorial: `n * fact(n−1)`
- GCD: `gcd(a,b) = b == 0 ? a : gcd(b, a % b)`
- Power: `pow(x, n)` with `n/2` splitting → O(log n)
- Ackermann: `A(0,n)=n+1; A(m,0)=A(m−1,1); A(m,n)=A(m−1, A(m,n−1))`; `A(2,2)=7`
- Tower of Hanoi: `2ⁿ − 1` moves.

### 9.4 Variadic functions (awareness)
`int printf(const char *fmt, ...)` uses `<stdarg.h>` (`va_list`, `va_start`, `va_arg`, `va_end`). The callee cannot know the number/types of arguments — which is why wrong format specifiers are UB.

### 9.5 `main` and `exit`
`return n;` from `main` ≡ `exit(n)`. `exit()` flushes buffers and runs `atexit` handlers; `_exit/abort` do not.

### Practice Questions — Chapter 9  *(13 questions, 17 marks)*

**Q9.1**  `Output · 1M`  What is the output?

```c
void f(int x) { x = 100; }
int main() {
    int a = 5;
    f(a);
    printf("%d", a);
}
```

**Q9.2**  `Output · 1M`  What is the output?

```c
void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }
int main() {
    int x = 3, y = 7;
    swap(&x, &y);
    printf("%d %d", x, y);
}
```

**Q9.3**  `Output · 1M`  What is the output?

```c
int f(int n) {
    if (n <= 1) return 1;
    return f(n - 1) + f(n - 2);
}
int main() { printf("%d", f(6)); }
```

**Q9.4**  `NAT · 2M`  For the function above, how many calls to `f` (including the first) are made by `f(5)`?

**Q9.5**  `Output · 2M`  What is the output?

```c
void f(int n) {
    if (n > 0) {
        f(n - 1);
        printf("%d", n);
        f(n - 1);
    }
}
int main() { f(3); }
```

**Q9.6**  `Output · 1M`  What is the output?

```c
void f(int n) {
    if (n == 0) return;
    printf("%d ", n);
    f(n - 1);
    printf("%d ", n);
}
int main() { f(3); }
```

**Q9.7**  `Output · 1M`  What does `f(1234)` return?

```c
int f(int x) {
    if (x == 0) return 0;
    return x % 10 + f(x / 10);
}
int main() { printf("%d", f(1234)); }
```

**Q9.8**  `NAT · 2M`  The value of `A(2, 2)` is ______.

```c
int A(int m, int n) {
    if (m == 0) return n + 1;
    if (n == 0) return A(m - 1, 1);
    return A(m - 1, A(m, n - 1));
}
int main() { printf("%d", A(2, 2)); }
```

**Q9.9**  `Output · 2M`  Assume `sizeof(int)=4`, 64-bit pointers. What is printed?

```c
void f(int a[10]) { printf("%zu ", sizeof(a)); }
int main() {
    int a[10];
    f(a);
    printf("%zu", sizeof(a));
}
```

**Q9.10**  `NAT · 1M`  With `f(1) = 0` and `f(n) = 1 + f(n/2)` (integer division), the value returned by `f(64)` is ______.

**Q9.11**  `Output · 1M`  What is the output?

```c
int f(int n) { return n > 0 ? n + f(n - 1) : 0; }
int main() { printf("%d", f(5)); }
```

**Q9.12**  `MCQ · 1M`  The time complexity of `void g(int n) { if (n <= 1) return; g(n-1); g(n-1); }` is:

- (A) O(n)
- (B) O(n²)
- (C) O(2ⁿ)
- (D) O(log n)

**Q9.13**  `MCQ · 1M`  A recursive function lacking a base case will typically:

- (A) Return 0
- (B) Run forever with constant stack
- (C) Overflow the stack (crash)
- (D) Be rejected by the compiler

### Answer Key — Chapter 9

- **9.1** — Output: `5` ✅ — `x` is a copy of `a`.
- **9.2** — Output: `7 3` ✅ — Addresses are passed, so the caller's variables are swapped.
- **9.3** — Output: `13` ✅ — f(2)=2, f(3)=3, f(4)=5, f(5)=8, f(6)=13.
- **9.4** — **15** — C(n) = 1 + C(n−1) + C(n−2) with C(0)=C(1)=1 → 1,1,3,5,9,15.
- **9.5** — Output: `1213121` ✅ — Each f(k) prints f(k−1), k, f(k−1): f(1)=1, f(2)=121, f(3)=1213121.
- **9.6** — Output: `3 2 1 1 2 3` ✅ — Pre-order prints on the way down (3 2 1), post-order on the way back (1 2 3).
- **9.7** — Output: `10` ✅ — Sum of the digits: 4+3+2+1.
- **9.8** — Output: `7` ✅ — A(2,n) = 2n + 3, so A(2,2) = 7.
- **9.9** — Output: `8 40` ✅ — Inside `f`, `a` is really `int *` (8 bytes). In `main` it is a real array (40 bytes).
- **9.10** — **6** — 64 → 32 → 16 → 8 → 4 → 2 → 1: six halvings.
- **9.11** — Output: `15` ✅ — 5+4+3+2+1+0.
- **9.12** — **(C)** — T(n) = 2T(n−1) + 1 → 2ⁿ.
- **9.13** — **(C)** — Each call pushes a new frame; the stack is finite.


---

## Chapter 10 — Storage Classes, Scope, Lifetime and Linkage


Four **independent** properties of an identifier/object — never mix them up:

| Property | Question it answers | Values |
|---|---|---|
| **Scope** | Where can the name be used? | block, file, function (labels), function-prototype |
| **Storage duration (lifetime)** | How long does the object exist? | automatic, static, allocated (heap), thread |
| **Linkage** | Do declarations in different places refer to the same entity? | none, internal, external |
| **Type** | What is it? | … |

`scope ≠ lifetime`, `scope ≠ linkage`.

### 10.1 Storage-class specifiers
| Specifier | Where | Lifetime | Linkage | Default init |
|---|---|---|---|---|
| `auto` (default for locals) | block | automatic: block entry → exit | none | **indeterminate** (garbage) |
| `register` | block | automatic | none | indeterminate; **cannot take `&`** of it |
| `static` local | block | **whole program** (initialized once) | none | **0** |
| `static` global/function | file | whole program | **internal** (this file only) | 0 |
| global (no specifier) | file | whole program | **external** | **0** |
| `extern` | declares an object/function defined elsewhere | — | external | — |

- `static` locals are initialized **once**, before the program starts, with a **constant expression**, and keep their value between calls.
- Globals and statics are zero-initialized; automatic locals are **not**.
- `extern int x;` is a *declaration*; `int x;` at file scope is a *definition* (tentative).
- Only one definition of an external object across the program (one-definition rule); any number of declarations.

### 10.2 Scope rules
- **Block scope:** a name declared in `{ }` is visible from its declaration to the end of the block; an inner declaration **hides** (shadows) an outer one.
- **File scope:** declared outside all functions → visible from the declaration to the end of the file.
- A local with the same name as a global hides the global (use `extern int x;` inside the block to reach it).
- C99: `for (int i = 0; …)` — `i` has scope limited to the loop.
- Labels have function scope (usable by `goto` before or after definition).

### 10.3 Lifetime examples
```c
int *f(void) { int x = 5; return &x; }     // dangling: x's lifetime ended
int *g(void) { static int x = 5; return &x; } // OK: static lifetime
```
`static` local: **block scope + static lifetime** — the key GATE combination.

### 10.4 Declaration vs definition
Declaration tells the compiler about a name/type; definition allocates storage (object) or supplies the body (function). `extern int x;` → declaration only. `int x = 5;` → definition.

### Practice Questions — Chapter 10  *(10 questions, 12 marks)*

**Q10.1**  `Output · 1M`  What is the output?

```c
void f() {
    static int c = 0;
    int a = 0;
    c++; a++;
    printf("%d %d ", c, a);
}
int main() { f(); f(); f(); }
```

**Q10.2**  `Output · 1M`  What is the output?

```c
int g;
int main() {
    printf("%d", g);
}
```

**Q10.3**  `Output · 1M`  What is the output?

```c
int x = 5;
int main() {
    int x = 10;
    {
        int x = 20;
        printf("%d ", x);
    }
    printf("%d ", x);
}
```

**Q10.4**  `Output · 2M`  What is the output?

```c
int f() {
    static int x = 5;
    x += 1;
    return x;
}
int main() { printf("%d", f() + f()); }
```

**Q10.5**  `MCQ · 1M`  A `static` local variable has:

- (A) Block scope and automatic lifetime
- (B) Block scope and static lifetime
- (C) File scope and static lifetime
- (D) File scope and automatic lifetime

**Q10.6**  `MCQ · 1M`  A global declared `static int x;` in file `a.c` can be accessed from `b.c` via `extern int x;`.

- (A) True
- (B) False — it has internal linkage

**Q10.7**  `MCQ · 1M`  Which declaration makes `&x` illegal?

- (A) `static int x;`
- (B) `register int x;`
- (C) `auto int x;`
- (D) `extern int x;`

**Q10.8**  `MCQ · 2M`  Which function returns a valid pointer that stays usable after the call?

```c
int *f1() { int x = 1; return &x; }
int *f2() { static int x = 1; return &x; }
int *f3() { int x = 1; static int *p; p = &x; return p; }
```

- (A) f1 only
- (B) f2 only
- (C) f1 and f3
- (D) f2 and f3

**Q10.9**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 5;
    for (int i = 0; i < 2; i++) printf("%d", i);
    printf("%d", i);
}
```

**Q10.10**  `MCQ · 1M`  What is the difference in the **default initial value** of `int a;` declared (i) at file scope, (ii) inside a function, (iii) as `static` inside a function?

- (A) 0, 0, 0
- (B) 0, garbage, 0
- (C) garbage, garbage, 0
- (D) 0, garbage, garbage

### Answer Key — Chapter 10

- **10.1** — Output: `1 1 2 1 3 1` ✅ — `c` is static (initialized once, persists); `a` is re-created as 0 on each call.
- **10.2** — Output: `0` ✅ — Globals have static storage duration → zero-initialized.
- **10.3** — Output: `20 10` ✅ — Each inner declaration hides the outer one within its block.
- **10.4** — Output: `13` ✅ — Calls return 6 and 7 (in either order — the sum is the same). `x` is initialized only once.
- **10.5** — **(B)** — It can be named only inside its block but lives for the whole program.
- **10.6** — **(B)** — `static` at file scope gives internal linkage — the name is private to its translation unit.
- **10.7** — **(B)** — A `register` object has no guaranteed address, so the address-of operator cannot be applied.
- **10.8** — **(B)** — f1 and f3 return the address of an automatic variable whose lifetime ends at return (dangling). f2's variable is static.
- **10.9** — Output: `015` ✅ — The loop's `i` shadows the outer one only inside the `for`.
- **10.10** — **(B)** — Static storage duration (file scope or `static`) → 0; automatic → indeterminate.


---

## Chapter 11 — Arrays (1-D, Multi-Dimensional, Address Calculation)


### 11.1 Basics
```c
int a[5];                   // valid indexes 0..4 — a[5] is out of bounds (UB)
int a[5] = {1,2,3,4,5};
int a[5] = {1,2};           // rest are zero → 1 2 0 0 0
int a[]  = {10,20,30,40};   // size inferred = 4
int a[5] = {[2] = 7};       // C99 designated initializer → 0 0 7 0 0
int a[5] = {0};             // all zeros
```
Number of elements: `sizeof(a) / sizeof(a[0])`  (works only on a real array, not on a pointer/parameter).
There is no bounds checking in C.

### 11.2 Array ≠ pointer (decay)
In most expressions an array name **decays** to a pointer to its first element (`a` ⟶ `&a[0]`, type `int *`). The exceptions are:
1. operand of **`sizeof`** → total array size
2. operand of **`&`** → pointer to the **whole array** (`int (*)[5]`)
3. a string literal used to **initialize** a char array

`sizeof(a)` = array size; `sizeof(a + 0)` = pointer size. `&a` and `a` have the same address but different types (`&a + 1` skips the whole array).

### 11.3 Indexing = pointer arithmetic
`a[i]` ≡ `*(a + i)` ≡ `*(i + a)` ≡ `i[a]`.
For `int a[2][3]`:
- `a[i][j]` ≡ `*(*(a+i)+j)`
- `a` has type `int (*)[3]`; `a+1` moves by **one row** (3 ints)
- `*a` / `a[0]` has type `int *`; `*a + 1` moves by one int.
- `sizeof(a)` = 24, `sizeof(a[0])` = 12, `sizeof(a[0][0])` = 4 (with 4-byte int).

### 11.4 Row-major storage and address formulas
C stores multi-dimensional arrays in **row-major order**.
- `A[R][C]`, base `B`, element size `w`: `addr(A[i][j]) = B + (i·C + j)·w`
- 3-D `A[X][Y][Z]`: `addr(A[i][j][k]) = B + ((i·Y + j)·Z + k)·w`
- 1-D with lower bound `L`: `addr(A[i]) = B + (i − L)·w`
- (Column-major, e.g. Fortran: `B + (j·R + i)·w`.)

### 11.5 Passing arrays
`void f(int a[])`, `void f(int *a)` are identical. For 2-D, all dimensions except the first must be given: `void f(int a[][4])` ≡ `void f(int (*a)[4])`.
Arrays can't be assigned or compared with `=`/`==`; structs containing arrays can be copied by assignment.

### 11.6 Variable-length arrays (C99)
`int a[n];` with runtime `n` has automatic lifetime; `sizeof(a)` is evaluated at run time.

### Practice Questions — Chapter 11  *(12 questions, 16 marks)*

**Q11.1**  `Output · 1M`  What is the output?

```c
int main() {
    int a[5] = {1, 2};
    int s = 0, i;
    for (i = 0; i < 5; i++) s += a[i];
    printf("%d %d", s, a[3]);
}
```

**Q11.2**  `NAT · 2M`  An array `int A[10][20]` is stored row-major with base address 1000 and `int` = 4 bytes. The address of `A[3][4]` is ______.

**Q11.3**  `NAT · 2M`  A 3-D array `int A[5][6][7]` is stored row-major, base address 0, element size 2 bytes. The address of `A[2][3][4]` is ______.

**Q11.4**  `NAT · 1M`  A 1-D array `A[−5 .. 20]` (inclusive) has base address 500 and element size 4. The address of `A[7]` is ______.

**Q11.5**  `Output · 2M`  Assume 4-byte `int`. What is the output?

```c
int main() {
    int a[2][3] = {{1,2,3},{4,5,6}};
    printf("%d %d %d %zu %zu", *(a[1] + 1), **a, a[1][2], sizeof(a[0]), sizeof(a));
}
```

**Q11.6**  `Output · 2M`  What is the output (64-bit)?

```c
int main() {
    int a[2][3];
    printf("%ld %ld", (char *)(a + 1) - (char *)a, (char *)(*a + 1) - (char *)a);
}
```

**Q11.7**  `Output · 1M`  What is the output?

```c
int main() {
    int a[] = {10, 20, 30};
    printf("%d %d %d", 2[a], *(a + 1), (&a[2])[-1]);
}
```

**Q11.8**  `Output · 1M`  What is the output (4-byte int, 8-byte pointers)?

```c
int main() {
    int a[10];
    int *p = a;
    printf("%zu %zu %zu", sizeof(a), sizeof(p), sizeof(a + 0));
}
```

**Q11.9**  `Output · 1M`  What is the output?

```c
void inc(int a[], int n) { for (int i = 0; i < n; i++) a[i]++; }
int main() {
    int a[3] = {1, 2, 3};
    inc(a, 3);
    printf("%d%d%d", a[0], a[1], a[2]);
}
```

**Q11.10**  `MCQ · 1M`  For `int a[5]; int *p = &a[0];` which statement is **false**?

- (A) `a[2]` and `*(p+2)` denote the same object
- (B) `a = p;` is legal
- (C) `sizeof(a)` ≠ `sizeof(p)` (in general)
- (D) `&a[0] == a`

**Q11.11**  `MCQ · 1M`  Which of the following correctly accesses `m[i][j]` for `int m[3][4]` inside a function that receives `m`?

- (A) `void f(int a[][])`
- (B) `void f(int a[][4])`
- (C) `void f(int **a)`
- (D) `void f(int a[3][])`

**Q11.12**  `Output · 1M`  What is the output?

```c
int main() {
    int a[4] = {5, 6, 7, 8};
    int *p = a + 3;
    int *q = a;
    printf("%ld %d", p - q, *(p - 1));
}
```

### Answer Key — Chapter 11

- **11.1** — Output: `3 0` ✅ — Remaining elements are zero-initialized.
- **11.2** — **1256** — 1000 + (3·20 + 4)·4 = 1000 + 256 = 1256.
- **11.3** — **218** — ((2·6 + 3)·7 + 4)·2 = (15·7 + 4)·2 = 109·2 = 218.
- **11.4** — **548** — 500 + (7 − (−5))·4 = 500 + 48 = 548.
- **11.5** — Output: `5 1 6 12 24` ✅ — `a[1]+1` → a[1][1] = 5; `**a` = a[0][0] = 1; a[1][2] = 6; a row = 12 bytes; whole array = 24 bytes.
- **11.6** — Output: `12 4` ✅ — `a+1` advances one row (3 ints = 12 bytes); `*a + 1` advances one int (4 bytes).
- **11.7** — Output: `30 20 20` ✅ — `2[a]` ≡ `a[2]`; `*(a+1)` = a[1]; `(&a[2])[-1]` = `*(&a[2] − 1)` = a[1].
- **11.8** — Output: `40 8 8` ✅ — `sizeof(a)` is the array; `a + 0` is an expression so `a` decays to a pointer.
- **11.9** — Output: `234` ✅ — The array is passed as a pointer, so the callee modifies the caller's elements.
- **11.10** — **(B)** — An array name is not a modifiable lvalue; it cannot be assigned.
- **11.11** — **(B)** — All but the first dimension must be specified; `int **` is a pointer to pointers, not to a 2-D array.
- **11.12** — Output: `3 7` ✅ — Pointer subtraction gives the element distance (3), not bytes.


---

## Chapter 12 — Pointers: Arithmetic, Operators, Pitfalls


### 12.1 Basics
```c
int x = 10;
int *p = &x;     // p holds the address of x
*p = 20;         // x is now 20  (dereference = access the object p points to)
int **pp = &p;   // *pp == p, **pp == x
```
`*&x == x`, `&*p == p` (when p is valid).

### 12.2 Pointer arithmetic is **type-scaled**
`p + n` advances by `n × sizeof(*p)` bytes.
- `int *p` at address 1000 → `p+1` = 1004; `double *` → 1008; `char *` → 1001.
- `float *p = 2000; p + 5` → 2020.
- `p − q` (same array) = **number of elements** between them (type `ptrdiff_t`), not bytes.
- Only **same-array** pointers (or one-past-the-end) may be subtracted or compared with `< >`.
- Adding two pointers is illegal; pointer + integer, pointer − integer, pointer − pointer are legal.
- `p[i]` ≡ `*(p + i)`.

### 12.3 The four unary-operator combinations (memorize!)
| Expression | Means | Effect |
|---|---|---|
| `*p++` | `*(p++)` | value at old p; **pointer** moves on |
| `(*p)++` | | value at p returned, then the **pointed object** is incremented |
| `++*p` | `++(*p)` | pointed object incremented, new value returned |
| `*++p` | `*(++p)` | pointer moves first, then dereferenced |

Postfix and prefix `++` / `*` / `&`: postfix is higher than unary; unary operators associate right-to-left.

### 12.4 Special pointers
| Kind | Description |
|---|---|
| **NULL pointer** | points to no object; comparing with 0/NULL is true; dereference = UB. `NULL` ≠ `'\0'` conceptually (not simply "address 0"). |
| **Wild pointer** | uninitialized pointer — indeterminate value |
| **Dangling pointer** | points to an object whose lifetime ended (after `free`, or to a returned local) |
| **`void *`** | generic object pointer; implicit conversion to/from any object pointer type in C; cannot be dereferenced; arithmetic on it is non-standard (GCC allows, step = 1) |
| **Pointer to pointer** | `int **pp` |

### 12.5 Pointers and strings / pointer to struct
`char *s = "abc";` — `s` points to a read-only literal. `p->m` ≡ `(*p).m` (`*p.m` would mean `*(p.m)`).

### 12.6 Pointer casts
Conversion does not change the object, only how it is interpreted. `(char *)p + 1` moves 1 byte; `(int *)p + 1` moves `sizeof(int)`. Accessing an object through an incompatible type violates **strict aliasing** (UB), except through `char *`.

### 12.7 Dereference checklist
When you see `*p`, ask: initialized? non-NULL? points to a live object? correct type? within bounds? properly aligned? If any answer is "no" → UB.

### 12.8 Memory-map of a pointer-using program
Pointer variable itself (`p`) lives wherever the variable lives (stack/global); the object it points to may live in stack, heap, or static storage.

### Practice Questions — Chapter 12  *(12 questions, 16 marks)*

**Q12.1**  `Output · 2M`  What is printed? (values shown after each step)

```c
int main() {
    int a[] = {10, 20, 30, 40};
    int *p = a;
    int x = *p++;     // x, p→a[1]
    int y = (*p)++;   // y, a[1]++
    int z = ++*p;     // z
    int w = *++p;     // w, p→a[2]
    printf("%d %d %d %d %d", x, y, z, w, a[1]);
}
```

**Q12.2**  `NAT · 1M`  A `float *p` holds the address 2000 (4-byte float). The value of `p + 5` is ______.

**Q12.3**  `Output · 1M`  What is the output (64-bit `long` for `%ld`)?

```c
int main() {
    int a[10];
    int *p = &a[7], *q = &a[2];
    printf("%ld %ld", p - q, (char *)p - (char *)q);
}
```

**Q12.4**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 10;
    int *p = &x;
    int **pp = &p;
    **pp += 5;
    *p *= 2;
    printf("%d %d", x, **pp);
}
```

**Q12.5**  `Output · 2M`  What is the output?

```c
int main() {
    int a[] = {1, 2, 3, 4};
    int *p[] = {a, a + 1, a + 2, a + 3};
    int **pp = p;
    pp++;
    printf("%ld %ld %d\n", pp - p, *pp - a, **pp);
    *pp++;
    printf("%ld %ld %d", pp - p, *pp - a, **pp);
}
```

**Q12.6**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 5;
    printf("%d", *&*&x);
}
```

**Q12.7**  `MCQ · 1M`  Which of the following is **illegal** in standard C (all pointers `int *p, *q; int a[10];` valid and in the same array)?

- (A) `p - q`
- (B) `p + q`
- (C) `p + 3`
- (D) `p < q`

**Q12.8**  `MCQ · 1M`  Identify the dangerous statement(s):

```c
int *p1;                       // (1)
int *p2 = NULL;                // (2)
int x = 3; int *p3 = &x;       // (3)
*p1 = 5;                       // (4)
*p3 = 5;                       // (5)
```

- (A) (4) only
- (B) (4) and (5)
- (C) (2) and (4)
- (D) (1) and (4)

**Q12.9**  `Output · 2M`  What is the output?

```c
int main() {
    int a[] = {1, 2, 3, 4, 5};
    int *p = a + 4;
    int s = 0;
    for (;;) {
        s += *p;
        if (p == a) break;
        p--;
    }
    printf("%d", s);
}
```

**Q12.10**  `MCQ · 1M`  `void *p = &x;` `p++;` — which is correct in **strictly standard** C?

- (A) p advances by `sizeof(x)`
- (B) p advances by 1 byte
- (C) It is not allowed (no size for `void`); GCC accepts it as an extension
- (D) p becomes NULL

**Q12.11**  `MCQ · 1M`  What is wrong with this function?

```c
int *f() {
    int a[3] = {1, 2, 3};
    return a;
}
```

- (A) Nothing
- (B) Returns a dangling pointer to an automatic array
- (C) Cannot return a pointer
- (D) `a` must be `static const`

**Q12.12**  `Output · 2M`  What is the output?

```c
void change(int *p) { p = (int *)malloc(sizeof(int)); *p = 99; }
int main() {
    int x = 1;
    int *q = &x;
    change(q);
    printf("%d", *q);
}
```

### Answer Key — Chapter 12

- **12.1** — Output: `10 20 22 30 22` ✅ — x=10 (p→a[1]); y=20 and a[1]=21; z: a[1]=22 → z=22; `*++p` → p→a[2] → w=30; a[1] = 22.
- **12.2** — **2020** — 2000 + 5 × 4.
- **12.3** — Output: `5 20` ✅ — Element distance 5; byte distance 5×4 = 20.
- **12.4** — Output: `30 30` ✅ — x = 10 → 15 → 30.
- **12.5** — Output: `1 1 2` ↵ `2 2 3` ✅ — After `pp++`, pp points to p[1] → pp−p = 1, `*pp − a` = 1, `**pp` = a[1] = 2. The statement `*pp++;` simply advances pp to p[2] → 2 2 3.
- **12.6** — Output: `5` ✅ — `&x` then `*` returns to x; repeated → x.
- **12.7** — **(B)** — Adding two pointers has no meaning.
- **12.8** — **(A)** — `p1` is an uninitialized (wild) automatic pointer; `*p1 = 5` is UB. (1) itself is just a declaration.
- **12.9** — Output: `15` ✅ — p walks from a[4] down to a[0]; the break test happens *before* decrementing past the start. (A `while (p >= a) ... p--` version would form the invalid pointer `a-1` — UB.)
- **12.10** — **(C)** — Pointer arithmetic needs a complete object type; GCC treats `void *` arithmetic as `char *` arithmetic as an extension.
- **12.11** — **(B)** — `a` ceases to exist when `f` returns.
- **12.12** — Output: `1` ✅ — The pointer is passed by value; reassigning `p` inside doesn't affect `q` (and the malloc'd block leaks).


---

## Chapter 13 — Complex Declarations, Function Pointers, const / volatile / restrict


### 13.1 Reading declarations (right-left / spiral rule)
Start at the identifier, go right (`[]`, `()`) until a `)` or end, then go left (`*`, type).
| Declaration | Meaning |
|---|---|
| `int *p;` | p is a pointer to int |
| `int **p;` | pointer to pointer to int |
| `int *p[5];` | **array** of 5 pointers to int (`[]` binds tighter than `*`) |
| `int (*p)[5];` | **pointer to an array** of 5 ints |
| `int *f();` | function returning `int *` |
| `int (*fp)(int, int);` | **pointer to function** (two ints) returning int |
| `int (*fp[3])(int);` | array of 3 pointers to functions(int) returning int |
| `int (*f(int))[5];` | function(int) returning pointer to array of 5 int |
| `char *(*fp)(char *);` | pointer to function(char *) returning `char *` |

`sizeof(*p)` for `int (*p)[5]` is 20; `p + 1` skips 20 bytes.

### 13.2 `typedef`
Creates an **alias** (not a new type). `typedef int (*op)(int,int);  op f;` makes `f` a function pointer. `typedef struct node { int d; struct node *n; } Node;`.

### 13.3 Function pointers
```c
int add(int a, int b) { return a + b; }
int (*fp)(int, int) = add;     // or &add
fp(2, 3);                      // ≡ (*fp)(2, 3)
int (*op[2])(int,int) = { add, sub };   // dispatch table: op[1](5,3)
```
- Function name decays to a pointer to the function; no arithmetic on function pointers.
- **Callbacks:** `void apply(int (*f)(int), int *a, int n)`; `qsort(base, n, size, cmp)` takes a comparator pointer.

### 13.4 `const`
| Declaration | p changeable? | `*p` changeable via p? |
|---|---|---|
| `const int *p;` / `int const *p;` | yes | **no** |
| `int * const p = &x;` | **no** | yes |
| `const int * const p = &x;` | no | no |

Rule: `const` applies to what is **immediately to its left** (or right if nothing on the left). Modifying a truly `const` object (even via a cast) is **UB**.

### 13.5 `volatile`
Tells the compiler the object may change outside the program's control (memory-mapped I/O, signal handlers, other threads) → every access must really occur; it must not cache the value in a register or eliminate "redundant" reads/writes. Does **not** provide atomicity or ordering.

### 13.6 `restrict` (C99)
A promise that, during the lifetime of the pointer, the pointed-to object is accessed only through that pointer (or pointers derived from it). Enables optimizations; breaking the promise → UB. Example: `memcpy(void *restrict d, const void *restrict s, size_t n)` vs `memmove` (which allows overlap).

### 13.7 `inline` (C99) and `static inline`
A hint to the compiler; no semantic difference except linkage rules.

### Practice Questions — Chapter 13  *(10 questions, 12 marks)*

**Q13.1**  `MCQ · 1M`  In `int (*a[5])(int);` the identifier `a` is:

- (A) a pointer to an array of 5 function pointers
- (B) an array of 5 pointers to functions taking int and returning int
- (C) a function returning an array of pointers
- (D) a pointer to a function returning an array of 5 ints

**Q13.2**  `MCQ · 2M`  Match: (P) `int *p[5];`  (Q) `int (*p)[5];`  (R) `int *p();`  (S) `int (*p)();`

- (A) P: array of ptrs, Q: ptr to array, R: function returning ptr, S: ptr to function
- (B) P: ptr to array, Q: array of ptrs, R: ptr to function, S: function returning ptr
- (C) P: array of ptrs, Q: ptr to array, R: ptr to function, S: function returning ptr
- (D) all four are the same

**Q13.3**  `Output · 2M`  What is the output (4-byte `int`, 8-byte pointer)?

```c
int main() {
    int a[5];
    int (*p)[5] = &a;
    int *q[5];
    printf("%zu %zu %zu", sizeof(*p), sizeof(p), sizeof(q));
}
```

**Q13.4**  `Output · 1M`  What is the output?

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int main() {
    int (*op[2])(int, int) = { add, sub };
    printf("%d %d", op[0](5, 3), (*op[1])(5, 3));
}
```

**Q13.5**  `Output · 1M`  What is the output?

```c
int f(int x) { return x * 2; }
int main() {
    int (*fp)(int) = f;
    printf("%d", fp(fp(3)));
}
```

**Q13.6**  `MCQ · 1M`  Given `int x = 5, y = 6; const int *p = &x; int * const q = &x;` which statement is **valid**?

- (A) `*p = 10;`
- (B) `p = &y;`
- (C) `q = &y;`
- (D) `const` cannot be applied to pointers

**Q13.7**  `MCQ · 1M`  Which declaration makes **both** the pointer and the pointed-to int unmodifiable via the pointer?

- (A) `const int *p`
- (B) `int * const p`
- (C) `const int * const p`
- (D) `int const * p`

**Q13.8**  `MCQ · 1M`  Which of the following correctly declares `fp` as a pointer to a function that takes `int` and returns a pointer to `char`?

- (A) `char *fp(int);`
- (B) `char (*fp)(int);`
- (C) `char *(*fp)(int);`
- (D) `char **fp(int);`

**Q13.9**  `MCQ · 1M`  What is the effect of `volatile`?

- (A) The variable is stored in ROM
- (B) The compiler must not optimize away or cache accesses to the variable
- (C) The variable becomes thread-safe
- (D) The variable is zero-initialized

**Q13.10**  `Output · 1M`  What is the output?

```c
int main() {
    const int x = 5;
    int *p = (int *)&x;
    // *p = 10;   // would be UB: modifying a const object
    printf("%d", x);
}
```

### Answer Key — Chapter 13

- **13.1** — **(B)** — `a[5]` first → array of 5; `*` → pointers; `(int)` → to functions with an int parameter.
- **13.2** — **(A)** — Parentheses decide binding; see table 13.1.
- **13.3** — Output: `20 8 40` ✅ — `*p` is the whole int[5] = 20 bytes; `p` is a pointer; `q` is 5 pointers = 40 bytes.
- **13.4** — Output: `8 2` ✅ — `op[0]` is add, `op[1]` is sub.
- **13.5** — Output: `12` ✅ — f(f(3)) = f(6) = 12.
- **13.6** — **(B)** — `p` may be re-pointed but `*p` is read-only through p; `q` itself is const (but `*q = 10` would be fine).
- **13.7** — **(C)** — Both `const`s are present.
- **13.8** — **(C)** — `(*fp)` → pointer; `(int)` → function taking int; `char *` → returns char pointer.
- **13.9** — **(B)** — Typical use: memory-mapped registers and variables modified by interrupt/signal handlers.
- **13.10** — Output: `5` ✅ — The write is commented out; the point of the question is that un-commenting it is **undefined behaviour** (the compiler may keep `x` in ROM or fold it as 5).


---

## Chapter 14 — Strings and the string.h Library


### 14.1 What a C string is
No built-in string type: a string is a `char` array terminated by `'\0'` (value 0).
```c
char s[] = "GATE";     // G A T E \0  → sizeof(s) = 5, strlen(s) = 4
char t[10] = "GATE";   // sizeof 10, strlen 4 (rest zero-filled)
char *p = "GATE";      // p points to a read-only literal; sizeof(p) = pointer size
char a[3] = {'a','b','c'};  // character array, NOT a string (no '\0')
char b[3] = "abc";          // allowed in C (no room for '\0') but then not a string
```
- `'A'` is an `int` constant (4 bytes); `"A"` is `char[2]`; `'\0'` is 0; `'0'` is 48; `"0"` is `{'0','\0'}`.
- `sizeof("GATE") = 5` (includes `'\0'`); `strlen("GATE") = 4` (excludes it).
- Embedded `'\0'` ends the string for `strlen`: `strlen("ab\0cd") = 2`, `sizeof("ab\0cd") = 6`.
- **Modifying a string literal is UB** (`char *p = "abc"; p[0] = 'X';`). `char s[] = "abc"; s[0] = 'X';` is fine (a modifiable copy).
- `"abc"[1]` is `'b'`; `*("abc"+1)` is `'b'`.

### 14.2 Library functions
| Function | What it does | Notes |
|---|---|---|
| `strlen(s)` | length without `'\0'` | returns `size_t` (unsigned!) — `strlen(a) - strlen(b)` is never negative |
| `strcpy(d, s)` | copies including `'\0'` | no bounds check → buffer overflow |
| `strncpy(d, s, n)` | copies ≤ n chars, **pads with `'\0'` if s shorter**; does **not** add `'\0'` if `strlen(s) ≥ n` | |
| `strcat(d, s)` | appends s to d | d needs `strlen(d)+strlen(s)+1` bytes |
| `strncat(d, s, n)` | appends ≤ n chars **and always adds `'\0'`** | |
| `strcmp(a, b)` | `<0`, `0`, `>0` (lexicographic, by unsigned char) | only the **sign** is guaranteed; use `==0` for equality, never `a == b` (compares addresses) |
| `strncmp` | compare ≤ n chars | |
| `strchr/strrchr(s,c)` | first / last occurrence; NULL if absent | |
| `strstr(h, n)` | substring search | |
| `memcpy / memmove / memset` | raw byte ops; `memmove` handles overlap, `memcpy` does not | |
| `atoi / strtol` | string → integer | |

### 14.3 `sizeof` vs `strlen`
```c
char s[] = "GATE";   sizeof(s) = 5   strlen(s) = 4
char *p = s;         sizeof(p) = 8   strlen(p) = 4
```

### 14.4 Typical loops
```c
int len(char *s) { int n = 0; while (*s++) n++; return n; }
void rev(char *s) { char *e = s + strlen(s) - 1; while (s < e) { char t=*s; *s++=*e; *e--=t; } }
```
`*s++` returns the char then advances; `while (*s)` stops at `'\0'`.

### 14.5 Pitfalls
- `if (s1 == s2)` compares addresses, not contents.
- `char *p; strcpy(p, "x");` — uninitialized destination.
- `strcpy` overlap, destination too small, missing `'\0'`.
- `scanf("%s")` without width.

### Practice Questions — Chapter 14  *(12 questions, 14 marks)*

**Q14.1**  `Output · 1M`  What is the output (64-bit)?

```c
int main() {
    char s[] = "GATE";
    char t[10] = "GATE";
    char *p = "GATE";
    printf("%zu %zu %zu | %zu %zu %zu", sizeof(s), sizeof(t), sizeof(p), strlen(s), strlen(t), strlen(p));
}
```

**Q14.2**  `Output · 1M`  What is the output?

```c
int main() {
    char s[] = "ab\0cd";
    printf("%zu %zu", strlen(s), sizeof(s));
}
```

**Q14.3**  `Output · 1M`  What is the output?

```c
int main() {
    char *p = "GATE";
    printf("%c", *p++ + 1);
}
```

**Q14.4**  `Output · 2M`  What is the output?

```c
int main() {
    char s[] = "GATE2027";
    printf("%s|", s + 2);
    s[4] = '\0';
    printf("%s|%zu", s, strlen(s));
}
```

**Q14.5**  `Output · 1M`  What is the value printed?

```c
int len(char *s) { int n = 0; while (*s++) n++; return n; }
int main() { printf("%d", len("GATE")); }
```

**Q14.6**  `Output · 1M`  What is the output?

```c
int main() {
    char s[20] = "abc";
    strcat(s, "def");
    printf("%zu %s", strlen(s), s);
}
```

**Q14.7**  `Output · 1M`  What is the output?

```c
int main() {
    char a[] = "abc", b[] = "abc";
    printf("%d %d", a == b, strcmp(a, b) == 0);
}
```

**Q14.8**  `Output · 2M`  What is the output? (note `strlen` returns an **unsigned** type)

```c
int main() {
    if (strlen("ab") - strlen("abcd") > 0) printf("positive");
    else printf("not positive");
}
```

**Q14.9**  `MCQ · 1M`  Which line(s) is/are undefined behaviour?

```c
char *p = "hello";      // (1)
p[0] = 'H';              // (2)
char s[] = "hello";      // (3)
s[0] = 'H';              // (4)
```

- (A) (2) only
- (B) (2) and (4)
- (C) (1) and (2)
- (D) None

**Q14.10**  `Output · 1M`  What is the output?

```c
int main() {
    char s[8];
    strncpy(s, "ABCDEFGH", 4);
    s[4] = '\0';
    printf("%s", s);
}
```

**Q14.11**  `MCQ · 1M`  What does this function do?

```c
void f(char *s) {
    char *e = s + strlen(s) - 1;
    while (s < e) { char t = *s; *s++ = *e; *e-- = t; }
}
```

- (A) Copies s to itself
- (B) Reverses the string in place
- (C) Sorts the characters
- (D) Converts to upper case

**Q14.12**  `NAT · 1M`  What is printed?

```c
int main() {
    char s[] = "GATE";
    printf("%zu", sizeof(s) - strlen(s));
}
```

### Answer Key — Chapter 14

- **14.1** — Output: `5 10 8 | 4 4 4` ✅ — `sizeof` is the storage; `strlen` counts characters before the first `\0`.
- **14.2** — Output: `2 6` ✅ — `strlen` stops at the embedded `\0`; `sizeof` counts all 6 bytes (a b \0 c d \0).
- **14.3** — Output: `H` ✅ — `*p++` is `'G'` (71); +1 gives 72 = `'H'`; printed with `%c`.
- **14.4** — Output: `TE2027|GATE|4` ✅ — `s+2` → "TE2027". After `s[4] = '\0'` the string is "GATE".
- **14.5** — Output: `4` ✅ — The loop stops when `*s` is `'\0'`.
- **14.6** — Output: `6 abcdef` ✅ — `strcat` appends at the old `'\0'`.
- **14.7** — Output: `0 1` ✅ — `a == b` compares two different addresses → 0; `strcmp` compares contents.
- **14.8** — Output: `positive` ✅ — `2u − 4u` wraps around to a huge `size_t`, which is > 0.
- **14.9** — **(A)** — Writing to a string literal is UB; `s` is a modifiable array copy.
- **14.10** — Output: `ABCD` ✅ — `strncpy` copied 4 chars without a terminator; we add it manually. (Without line 4 the result would be unreliable.)
- **14.11** — **(B)** — Swaps the two ends and moves inward.
- **14.12** — Output: `1` ✅ — 5 − 4 = 1, the terminating `'\0'`.


---

## Chapter 15 — Structures, Unions, Enums, typedef, Bit-fields, Padding


### 15.1 Structures
```c
struct Student { int roll; char grade; float marks; };
struct Student s;   s.roll = 1;
struct Student *p = &s;   p->roll ≡ (*p).roll
```
- Members have **separate storage** (all hold values simultaneously). Members are laid out in **declaration order**.
- Structure assignment copies all members (including arrays inside); structs are passed/returned **by value**.
- Structs cannot be compared with `==`.
- A struct may contain a **pointer to itself** (`struct node *next;`) but not an instance of itself.

### 15.2 Padding and alignment (GATE favourite)
Each member is aligned to a multiple of **its own size** (the usual rule, for scalar types). The struct's total size is rounded up to a multiple of the **largest member alignment**.
```c
struct A { char a; int b;  char c; };  // a@0, pad 3, b@4, c@8, pad 3  → 12
struct B { int b; char a; char c; };   // b@0, a@4, c@5, pad 2         → 8
struct C { char a; char c; int b; };   //                              → 8
struct D { char c; double d; int i; }; // c@0 pad7, d@8, i@16 pad4    → 24 (double aligned to 8)
```
**Reordering members (largest first) minimizes padding.** `sizeof(struct)` ≥ sum of member sizes. Unless the question says "packed", assume natural alignment.

### 15.3 Unions
All members **share the same storage** starting at offset 0. Size = size of the largest member, rounded up to the strictest member alignment.
```c
union U { int i; char c[5]; double d; };   // max(4,5,8)=8, align 8 → 8
union V { char c[5]; int i; };             // 5 → rounded up to 8 (align 4 → multiple of 4 → 8)
```
Writing one member and reading another reinterprets the bytes (`u.i = 0x41424344; u.c` → `'D'` on little-endian — implementation-defined layout).

| Struct | Union |
|---|---|
| Separate storage per member | One shared storage |
| Size ≥ sum of members | Size = largest member (+padding) |
| All members usable simultaneously | Only the last-written member is meaningful |

### 15.4 `enum`
```c
enum day { SUN, MON, TUE };      // 0, 1, 2
enum { A, B = 5, C, D = 2, E };  // 0, 5, 6, 2, 3
```
Enumerators are **integer constants** (type `int`); successive values continue +1 from the previous. Two enumerators may share a value. `enum` variables are implementation-defined integer types.

### 15.5 `typedef`
Alias for a type; no new type. `typedef unsigned int uint;`, `typedef struct node Node;`.

### 15.6 Bit-fields
```c
struct { unsigned a : 3; unsigned b : 5; unsigned c : 1; } x;   // typically 4 bytes
```
Packing/ordering are implementation-defined; cannot take the address of a bit-field; signedness of plain `int` bit-fields is implementation-defined.

### 15.7 Endianness
Little-endian (x86): least significant byte at the lowest address. `int x = 0x12345678;` → bytes `78 56 34 12`. Big-endian: `12 34 56 78`.

### 15.8 Struct arrays and pointer arithmetic
`struct S arr[3]; struct S *p = arr; p + 1` advances by `sizeof(struct S)` (padding included).

### Practice Questions — Chapter 15  *(11 questions, 15 marks)*

**Q15.1**  `Output · 2M`  Assume `char`=1, `short`=2, `int`=4, `double`=8 with natural alignment. `sizeof` for each struct:

```c
struct A { char a; int b;  char c; };
struct B { int b; char a; char c; };
struct C { char a; short b; char c; int d; };
struct D { char c; double d; int i; };
int main() {
    printf("%zu %zu %zu %zu", sizeof(struct A), sizeof(struct B), sizeof(struct C), sizeof(struct D));
}
```

**Q15.2**  `Output · 2M`  What is the output (64-bit, natural alignment)?

```c
union U { int i; char c[5]; double d; };
union V { char c[5]; int i; };
int main() { printf("%zu %zu", sizeof(union U), sizeof(union V)); }
```

**Q15.3**  `Output · 2M`  On a little-endian machine, what is printed?

```c
union T { int i; char c; };
int main() {
    union T u;
    u.i = 0x41424344;
    printf("%c", u.c);
}
```

**Q15.4**  `NAT · 2M`  The value of `A + B + C + D + E` is ______.

```c
enum { A, B = 5, C, D = 2, E };
```

**Q15.5**  `Output · 1M`  What is the output?

```c
struct P { int x, y; };
void f(struct P p) { p.x = 100; }
int main() {
    struct P a = {1, 2};
    f(a);
    printf("%d %d", a.x, a.y);
}
```

**Q15.6**  `Output · 1M`  What is the output?

```c
struct P { int x, y; };
int main() {
    struct P a = {1, 2}, *p = &a;
    p->x += 10;
    (*p).y *= 3;
    printf("%d %d", a.x, a.y);
}
```

**Q15.7**  `Output · 1M`  What is the output (4-byte int, natural alignment)?

```c
struct S { int a; char b; };
int main() {
    struct S arr[3];
    printf("%zu %ld", sizeof(arr), (char *)&arr[1] - (char *)arr);
}
```

**Q15.8**  `MCQ · 1M`  Which of the following is **not allowed** in C?

- (A) `struct N { int d; struct N *next; };`
- (B) `struct N { int d; struct N next; };`
- (C) `typedef struct N Node;`
- (D) `struct N a = {1, NULL};`

**Q15.9**  `Output · 1M`  Assume a struct `{unsigned a:3; unsigned b:5;}` on GCC/x86. Its `sizeof` is:

```c
struct F { unsigned a : 3; unsigned b : 5; };
int main() { printf("%zu", sizeof(struct F)); }
```

**Q15.10**  `Output · 1M`  What is the output?

```c
enum color { RED, GREEN = 4, BLUE };
int main() {
    enum color c = BLUE;
    printf("%d %d", c, RED);
}
```

**Q15.11**  `MCQ · 1M`  Which statement about unions is **false**?

- (A) All members share storage
- (B) The size is at least that of the largest member
- (C) All members can safely hold different values simultaneously
- (D) A union may contain a struct

### Answer Key — Chapter 15

- **15.1** — Output: `12 8 12 24` ✅ — A: 1+3pad+4+1+3pad=12; B: 4+1+1+2pad=8; C: a@0, pad1, b@2, c@4, pad3, d@8 → 12; D: 1+7pad+8+4+4pad=24.
- **15.2** — Output: `8 8` ✅ — U: max size 8, alignment 8 → 8. V: size 5 rounded up to a multiple of 4 → 8.
- **15.3** — Output: `D` ✅ — The least significant byte 0x44 (`'D'`) is stored at the lowest address, which is where `u.c` lives.
- **15.4** — **16** — A=0, B=5, C=6, D=2, E=3 → 16.
- **15.5** — Output: `1 2` ✅ — Structures are passed by value.
- **15.6** — Output: `11 6` ✅ — `p->x` ≡ `(*p).x`.
- **15.7** — Output: `24 8` ✅ — `sizeof(struct S)` = 8 (4 + 1 + 3 padding).
- **15.8** — **(B)** — A struct cannot contain an instance of itself (infinite size); a pointer to itself is fine.
- **15.9** — Output: `4` ✅ — Both fit inside one `unsigned int` storage unit (4 bytes). (Implementation-defined in general.)
- **15.10** — Output: `5 0` ✅ — BLUE follows GREEN (4) → 5.
- **15.11** — **(C)** — Writing one member overwrites the others.


---

## Chapter 16 — Dynamic Memory Allocation


Header: `<stdlib.h>`. Allocated on the **heap**; lifetime lasts until `free`.

| Function | Behaviour |
|---|---|
| `malloc(n)` | allocates `n` bytes, **uninitialized**; returns `void *` or `NULL` |
| `calloc(k, sz)` | allocates `k*sz` bytes, **zeroed**; returns `NULL` on failure |
| `realloc(p, n)` | resizes; may **move** the block (old pointer invalid if it does); `realloc(NULL, n)` ≡ `malloc(n)`; on failure returns `NULL` and the original block stays valid |
| `free(p)` | releases the block; `free(NULL)` is a no-op; freeing twice or a non-heap pointer → UB |

```c
int *a = malloc(n * sizeof *a);        // idiom: sizeof *a, no cast needed in C
if (!a) { /* handle failure */ }
int *t = realloc(a, 2*n*sizeof *a);    // never write a = realloc(a, ...) directly
if (t) a = t;
free(a); a = NULL;                     // avoid dangling pointer
```

### Problems
| Problem | Description |
|---|---|
| **Memory leak** | last pointer to a heap block lost / never freed (e.g. `p = malloc(..); p = malloc(..);`) |
| **Dangling pointer** | pointer to freed (or out-of-scope) memory |
| **Double free** | `free(p)` twice → UB |
| **Use after free** | UB |
| **Heap overflow** | writing beyond the allocated size |
| **Wild pointer** | uninitialized pointer |

### Dynamic 2-D arrays
1. **Array of row pointers:** `int **a = malloc(R*sizeof *a); for i: a[i] = malloc(C*sizeof **a);` → `R+1` `malloc` calls; rows not contiguous; free each row, then `a`.
2. **Single contiguous block:** `int (*a)[C] = malloc(R * sizeof *a);` then `a[i][j]` works; or `int *a = malloc(R*C*sizeof *a)` with `a[i*C + j]`.

### Linked structures
`struct node { int data; struct node *next; };` — allocate nodes with `malloc(sizeof(struct node))`; `NULL` terminates the list.
Common GATE tasks: reverse a list, insert/delete, count nodes, recursive traversal (print after the recursive call to print in reverse).

### Practice Questions — Chapter 16  *(9 questions, 11 marks)*

**Q16.1**  `MCQ · 1M`  What is the effect of this code?

```c
int *p = malloc(sizeof(int));
p = malloc(sizeof(int));
free(p);
```

- (A) No problem
- (B) One memory leak
- (C) Double free
- (D) Compile error

**Q16.2**  `NAT · 1M`  How many `malloc` calls are required to create an `R × C` matrix as an array of `R` row pointers (one for each row plus the pointer array)? For R = 10:

**Q16.3**  `MCQ · 1M`  Which statement about `calloc(n, sizeof(int))` vs `malloc(n * sizeof(int))` is correct?

- (A) `malloc` zero-initializes, `calloc` does not
- (B) `calloc` zero-initializes the allocated bytes, `malloc` leaves them indeterminate
- (C) Both zero-initialize
- (D) `calloc` allocates from the stack

**Q16.4**  `MCQ · 1M`  What is the problem in this snippet?

```c
int *p = malloc(sizeof(int));
*p = 5;
free(p);
printf("%d", *p);
```

- (A) Memory leak
- (B) Use after free — undefined behaviour
- (C) Double free
- (D) Nothing

**Q16.5**  `Output · 2M`  What does this function print for the list 1→2→3→4 (head = node 1)?

```c
struct node { int d; struct node *next; };
void f(struct node *h) {
    if (!h) return;
    f(h->next);
    printf("%d ", h->d);
}
```

**Q16.6**  `Output · 2M`  What is printed?

```c
struct node { int d; struct node *next; };
int main() {
    struct node *h = NULL, *t;
    for (int i = 1; i <= 4; i++) {
        t = malloc(sizeof *t);
        t->d = i; t->next = h; h = t;
    }
    for (t = h; t; t = t->next) printf("%d", t->d);
}
```

**Q16.7**  `MCQ · 1M`  Which is the safest way to grow an allocated array?

- (A) `p = realloc(p, n);`
- (B) `int *t = realloc(p, n); if (t) p = t;`
- (C) `free(p); p = malloc(n);` (data kept)
- (D) `realloc(p, n);` ignoring the result

**Q16.8**  `Output · 1M`  What is the output?

```c
int main() {
    int *a = calloc(5, sizeof(int));
    int s = 0;
    for (int i = 0; i < 5; i++) s += a[i];
    printf("%d", s);
    free(a);
}
```

**Q16.9**  `MCQ · 1M`  Which call is **safe**?

- (A) `free(p); free(p);`
- (B) `free(NULL);`
- (C) `int x; free(&x);`
- (D) `char *s = "hi"; free(s);`

### Answer Key — Chapter 16

- **16.1** — **(B)** — The first block's only pointer was overwritten and never freed.
- **16.2** — **11** — 1 for the array of pointers + 10 for the rows.
- **16.3** — **(B)** — Core difference between the two.
- **16.4** — **(B)** — `p` dangles after `free`.
- **16.5** — **4 3 2 1** — The print occurs after the recursive call → the list is printed in reverse.
- **16.6** — Output: `4321` ✅ — Each node is inserted at the head, so the list is 4→3→2→1.
- **16.7** — **(B)** — If `realloc` fails it returns NULL; assigning directly would lose (leak) the original block. The result must always be used because the block may move.
- **16.8** — Output: `0` ✅ — `calloc` zeroes the memory.
- **16.9** — **(B)** — `free(NULL)` does nothing; the others free memory not obtained from the allocator (or twice).


---

## Chapter 17 — The Preprocessor and Macros


The preprocessor runs **before compilation** and does pure **text substitution** (no type checking, no evaluation).

### 17.1 Directives
`#include <file>` / `"file"`, `#define`, `#undef`, `#if`, `#ifdef`, `#ifndef`, `#elif`, `#else`, `#endif`, `#error`, `#pragma`.
Include guard: `#ifndef H_ #define H_ … #endif`.

### 17.2 Object-like macros
`#define N 10` — **no `=` and no trailing `;`** (a trailing `;` becomes part of the replacement).
`#define M N+1` then `M*2` → `N+1*2` → `10+1*2` = 12 (missing parentheses).

### 17.3 Function-like macros — always mentally expand!
```c
#define SQ(x)  x*x          // SQ(2+3) → 2+3*2+3 = 11   (not 25)
#define SQ2(x) ((x)*(x))    // SQ2(2+3) = 25, but SQ2(i++) evaluates i++ TWICE → UB
#define MAX(a,b) ((a)>(b)?(a):(b))   // MAX(i++, j++) increments one of them twice
```
Rules: parenthesize **each parameter** and the **whole body**; arguments with side effects are evaluated as many times as the parameter appears; macro name followed immediately by `(`; no recursion (a macro is not re-expanded inside its own expansion).

### 17.4 Multi-statement macros
`#define SWAP(a,b) t=a; a=b; b=t;` used as `if (c) SWAP(x,y);` only guards the first statement. Use `do { ... } while (0)`.

### 17.5 `#` and `##`
- `#x` **stringizes** the argument: `#define STR(x) #x` → `STR(hello)` = `"hello"`.
- `a ## b` **pastes** tokens: `#define CAT(a,b) a##b` → `CAT(12,34)` = `1234`.

### 17.6 Macro vs function
| Macro | Function |
|---|---|
| Text substitution, no call overhead | Real call: pushes a frame |
| No type checking | Type checked |
| Arguments re-evaluated | Evaluated once |
| Code size grows with each use | Single copy |
| Cannot take its address | Can |

### 17.7 Conditional compilation
`#ifdef DEBUG … #endif`, `#if defined(X) && X > 2`. Code in a false branch is removed before compilation.
Predefined: `__LINE__`, `__FILE__`, `__DATE__`, `__TIME__`, `__STDC__`.

### Practice Questions — Chapter 17  *(10 questions, 11 marks)*

**Q17.1**  `Output · 1M`  What is the output?

```c
#define SQ(x) x*x
int main() { printf("%d", SQ(2 + 3)); }
```

**Q17.2**  `Output · 1M`  What is the output?

```c
#define PRODUCT(a,b) a*b
int main() { printf("%d", PRODUCT(1+2, 3+4)); }
```

**Q17.3**  `Output · 1M`  What is the output?

```c
#define A 2
#define B A+3
int main() { printf("%d", B*B); }
```

**Q17.4**  `Output · 2M`  What is printed?

```c
#define MAX(a,b) ((a)>(b)?(a):(b))
int main() {
    int i = 2, j = 3;
    int m = MAX(i++, j++);
    printf("%d %d %d", m, i, j);
}
```

**Q17.5**  `Output · 1M`  What is the output?

```c
#define STR(x) #x
#define CAT(a,b) a##b
int main() { printf("%s %d", STR(hello), CAT(12, 34)); }
```

**Q17.6**  `Output · 1M`  What is the output?

```c
#define M N+1
#define N 5
int main() { printf("%d", M * 2); }
```

**Q17.7**  `MCQ · 1M`  Which of the following is the best definition of a macro that squares its argument?

- (A) `#define SQ(x) x*x`
- (B) `#define SQ(x) (x*x)`
- (C) `#define SQ(x) ((x)*(x))`
- (D) `#define SQ(x) (x)*(x)`

**Q17.8**  `MCQ · 1M`  What is the problem with `#define N 10;` used as `int a[N];`?

- (A) None
- (B) It expands to `int a[10;];` — syntax error
- (C) `N` is not allowed in array sizes
- (D) `N` has type float

**Q17.9**  `MCQ · 1M`  Which statement about macros is **false**?

- (A) They are processed before compilation
- (B) Their arguments are type-checked
- (C) Their arguments can be evaluated more than once
- (D) You cannot take the address of a macro

**Q17.10**  `Output · 1M`  What is printed?

```c
#define DEBUG
int main() {
#ifdef DEBUG
    printf("A");
#else
    printf("B");
#endif
#ifndef RELEASE
    printf("C");
#endif
}
```

### Answer Key — Chapter 17

- **17.1** — Output: `11` ✅ — Expands to `2+3*2+3` = 2 + 6 + 3 = 11.
- **17.2** — Output: `11` ✅ — `1+2*3+4` = 1 + 6 + 4 = 11.
- **17.3** — Output: `11` ✅ — `B*B` → `A+3*A+3` → `2+3*2+3` = 11.
- **17.4** — Output: `4 3 5` ✅ — Expands to `((i++)>(j++)?(i++):(j++))`. The condition (2>3) is false (sequence point after it), so `j++` runs again: m = 4, j = 5, and i was incremented once → 3.
- **17.5** — Output: `hello 1234` ✅ — `#x` turns the argument into a string; `##` pastes tokens.
- **17.6** — Output: `7` ✅ — `M*2` → `N+1*2` → `5+1*2` = 7.
- **17.7** — **(C)** — Parenthesize every use of the parameter and the whole body.
- **17.8** — **(B)** — The semicolon is part of the replacement text.
- **17.9** — **(B)** — Macros are pure text substitution; no type checking.
- **17.10** — Output: `AC` ✅ — DEBUG is defined, RELEASE is not.


---

## Chapter 18 — Memory Model, Stack Frames and Runtime Behaviour


### 18.1 Typical process layout (low → high address)
```
┌───────────────────────┐ low addresses
│ Code / Text           │  machine instructions (read-only)
│ Read-only data        │  string literals, const globals
│ Initialized data      │  globals/statics with non-zero initializers
│ BSS                   │  globals/statics zero-initialized / uninitialized
│ Heap  ↓ grows upward  │  malloc/calloc/realloc
│          …            │
│ Stack ↑ grows downward│  frames: parameters, locals, return address
└───────────────────────┘ high addresses
```
Exact layout and growth direction are **platform-dependent**.

### 18.2 Where does it live?
| Item | Region |
|---|---|
| Ordinary local variable, parameter | **Stack** |
| `static` local, global | Data / BSS |
| `malloc`'d block | **Heap** |
| String literal `"abc"` | Read-only data |
| Function code | Text |
| `char s[] = "abc"` (local) | **Stack** (copy of the literal) |
| `char *p = "abc"` (local) | `p` on stack, literal in read-only data |

### 18.3 Stack frame (activation record)
Created at each call: return address, saved registers/frame pointer, parameters, local automatic variables. Destroyed on return.
- Recursion creates **one frame per active call** → recursion depth `d` costs O(d) stack space (times the frame size).
- Deep recursion or huge local arrays → **stack overflow**.
- `fact(n)` with base case `n==0` has **n+1** frames at its deepest.
- Tail-call optimization is not guaranteed by C.

### 18.4 Lifetimes recap
- Automatic: until the block ends.
- Static: whole program.
- Allocated: until `free`.
- Returning the address of an automatic object ⇒ dangling pointer.

### 18.5 Compilation pipeline
`source → preprocessor → compiler → assembler → object file(s) → linker (+libraries) → executable → loader → process`. Compile-time errors: syntax, type errors. Link-time errors: undefined/multiple-defined symbols. Run-time errors: segfault, division by zero (SIGFPE).

### Practice Questions — Chapter 18  *(7 questions, 8 marks)*

**Q18.1**  `MCQ · 1M`  Match each item with its memory region — (P) local `int x;` (Q) `static int y = 5;` (R) `malloc(10)` block (S) string literal `"abc"`.

- (A) P: stack, Q: data, R: heap, S: read-only data
- (B) P: heap, Q: stack, R: data, S: stack
- (C) P: stack, Q: stack, R: heap, S: stack
- (D) P: data, Q: data, R: heap, S: heap

**Q18.2**  `NAT · 1M`  For `int fact(int n) { if (n == 0) return 1; return n * fact(n-1); }`, the maximum number of simultaneously active activation records of `fact` for the call `fact(5)` (not counting `main`) is ______.

**Q18.3**  `MCQ · 1M`  The space complexity (stack) of the recursive `fact(n)` is:

- (A) O(1)
- (B) O(log n)
- (C) O(n)
- (D) O(n²)

**Q18.4**  `MCQ · 2M`  A function `void f(int n) { int a[100]; if (n > 0) f(n - 1); }` is called as `f(1000)`. The stack space used is proportional to:

- (A) 100
- (B) 1000
- (C) 100 × 1000
- (D) 1000²

**Q18.5**  `MCQ · 1M`  Which of the following would normally be a **compile-time** error rather than a run-time error?

- (A) Dereferencing NULL
- (B) Using an undeclared variable
- (C) Division by zero in a variable expression
- (D) Stack overflow

**Q18.6**  `MCQ · 1M`  A linker error such as "undefined reference to `foo`" means:

- (A) Syntax error in `foo`
- (B) `foo` was declared/called but no definition was linked
- (C) `foo` was defined twice
- (D) Type mismatch in a call

**Q18.7**  `MCQ · 1M`  Where are the following stored? `char s[] = "hi";` inside `main` and `char *p = "hi";` inside `main`.

- (A) `s` on stack (own copy); `p` on stack pointing to read-only data
- (B) Both on heap
- (C) `s` read-only; `p` on stack with its own copy
- (D) Both in the data segment

### Answer Key — Chapter 18

- **18.1** — **(A)** — Standard layout; see table 18.2.
- **18.2** — **6** — Calls for n = 5,4,3,2,1,0 are all active at the deepest point.
- **18.3** — **(C)** — One frame per recursion level.
- **18.4** — **(C)** — Each of the 1001 frames contains its own `int a[100]`.
- **18.5** — **(B)** — Undeclared identifiers are caught by the compiler.
- **18.6** — **(B)** — The object files reference a symbol that no object file/library defines.
- **18.7** — **(A)** — The array is a modifiable local copy; the pointer variable is a local that points at the literal.


---

## Chapter 19 — Command-Line Arguments, Files and Standard Library Odds & Ends


### 19.1 Command-line arguments
```c
int main(int argc, char *argv[])     // ≡ char **argv
```
- `argc` = number of arguments **including the program name**.
- `argv[0]` = program name, `argv[1..argc-1]` = arguments (strings), `argv[argc] == NULL`.
- `./a.out 10 20 30` → `argc = 4`, `argv[3]` is `"30"`, `atoi(argv[1]) = 10`.

### 19.2 File I/O (`<stdio.h>`)
```c
FILE *fp = fopen("data.txt", "r");   // NULL on failure
fclose(fp);
```
| Mode | Meaning |
|---|---|
| `"r"` | read; file must exist |
| `"w"` | write; **truncates** to zero length / creates |
| `"a"` | append; writes always go to the end / creates |
| `"r+"` | read+write, file must exist, no truncation |
| `"w+"` | read+write, truncates/creates |
| `"a+"` | read + append |
Add `b` for binary (`"rb"`).

| Function | Purpose |
|---|---|
| `fgetc / fputc / getc / putc` | one char (`fgetc` returns `int`; `EOF` = −1) |
| `fgets(buf, n, fp)` / `fputs` | line I/O (`fgets` keeps `'\n'`, reads ≤ n−1 chars) |
| `fscanf / fprintf` | formatted I/O |
| `fread / fwrite(ptr, size, count, fp)` | binary blocks; return items transferred |
| `fseek(fp, off, SEEK_SET/CUR/END)`, `ftell`, `rewind` | positioning |
| `feof(fp)` | true only **after** a read hit end-of-file |

**`while (!feof(fp))` pitfall:** `feof` becomes true only after a failed read, so the loop body runs once too often. Test the **return value** of the read function instead: `while (fscanf(fp, "%d", &x) == 1)` or `while ((c = fgetc(fp)) != EOF)`.

`stdin`, `stdout`, `stderr` are predefined `FILE *`; `printf(...)` ≡ `fprintf(stdout, ...)`. `stdout` is line-buffered/fully buffered, `stderr` unbuffered.

### 19.3 Useful `<stdlib.h>` / `<ctype.h>` / `<math.h>`
`atoi`, `strtol`, `abs`, `rand/srand`, `exit`, `qsort`, `bsearch`; `isalpha/isdigit/toupper/tolower`; `sqrt/pow/floor/ceil` (`ceil(−2.5) = −2`, `floor(−2.5) = −3`).

### Practice Questions — Chapter 19  *(6 questions, 7 marks)*

**Q19.1**  `MCQ · 1M`  A program is run as `./a.out 10 20 30`. What does `printf("%d %s", argc, argv[argc - 1]);` print?

- (A) `3 30`
- (B) `4 30`
- (C) `4 ./a.out`
- (D) `3 20`

**Q19.2**  `MCQ · 1M`  Which `fopen` mode **destroys** the existing contents of a file?

- (A) `"r"`
- (B) `"a"`
- (C) `"w"`
- (D) `"r+"`

**Q19.3**  `NAT · 2M`  A file contains the single number `5` followed by a newline. The loop below reads it. How many times does the body execute?

```c
int x;
while (!feof(fp)) {
    fscanf(fp, "%d", &x);
    printf("%d ", x);
}
```

**Q19.4**  `MCQ · 1M`  `fgetc` returns `int` rather than `char` because:

- (A) `char` is too small for ASCII
- (B) It must be able to return `EOF` (−1), which must be distinguishable from any valid character
- (C) For alignment
- (D) Historical reasons only

**Q19.5**  `MCQ · 1M`  `fseek(fp, 0, SEEK_END); long n = ftell(fp);` computes:

- (A) The number of lines
- (B) The file size in bytes (for a binary-mode file)
- (C) The position of the first byte
- (D) The number of words

**Q19.6**  `MCQ · 1M`  Assuming `fopen` succeeds, which statement about `fgets(buf, 5, fp)` is true?

- (A) Reads exactly 5 characters
- (B) Reads at most 4 characters and appends `'\0'`, stopping early after a newline
- (C) Strips the newline
- (D) Reads a whole line regardless of length

### Answer Key — Chapter 19

- **19.1** — **(B)** — `argc` counts the program name: 4. `argv[3]` is `"30"`.
- **19.2** — **(C)** — `"w"` truncates to zero length.
- **19.3** — **2** — After reading `5`, EOF has not yet been *detected* (the newline remains). The second `fscanf` fails, sets EOF and leaves `x` = 5 — so `5` is printed twice. Always test the return value of `fscanf`.
- **19.4** — **(B)** — With a `char` result, a legitimate byte 0xFF could be confused with EOF.
- **19.5** — **(B)** — Seek to the end, then the offset equals the length.
- **19.6** — **(B)** — `fgets` reads at most n−1 chars, keeps the newline if read, and NUL-terminates.


---

## Chapter 20 — C Code for Data Structures & Algorithms: GATE-Style Tracing


GATE's *Programming and Data Structures* section tests C code on arrays, lists, stacks, queues, trees and recursion. The C skills are the same; the traps are different:

| Pattern | What to watch |
|---|---|
| **Array rotation / reversal** | loop bounds (`i < n/2`), indexes `n-1-i` |
| **Binary search** | `mid = (lo+hi)/2`, `lo = mid+1`, `hi = mid-1`; iterations ≤ ⌊log₂ n⌋ + 1 |
| **Bubble sort** | swaps = number of inversions; comparisons n(n−1)/2 (without early exit) |
| **In-place matrix transpose** | swapping for all `i, j` (both triangles) undoes itself — loop only `j > i` |
| **Linked list** | pointer re-linking order; save `next` before overwriting |
| **Stack / queue with arrays** | `top = -1` empty; circular queue uses `(rear+1) % n`; full vs empty ambiguity |
| **BST** | inorder → sorted; preorder → root first |
| **Recursion on lists/trees** | print before vs after the recursive call |
| **Hidden UB** | out-of-bounds in loops `i <= n`; uninitialized accumulators |

**Always** run a small case by hand (n = 2, 3) before generalizing.

### Practice Questions — Chapter 20  *(10 questions, 17 marks)*

**Q20.1**  `NAT · 2M`  Binary search for the key 13 in the sorted array `a[i] = i` (16 elements). The value of `c` printed (number of loop iterations) is ______.

```c
int main() {
    int a[16], i;
    for (i = 0; i < 16; i++) a[i] = i;
    int lo = 0, hi = 15, key = 13, c = 0;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        c++;
        if (a[mid] == key) break;
        else if (a[mid] < key) lo = mid + 1;
        else hi = mid - 1;
    }
    printf("%d", c);
}
```

**Q20.2**  `NAT · 2M`  How many swaps does this bubble sort perform on `{5, 4, 3, 2, 1}`?

```c
int main() {
    int a[] = {5, 4, 3, 2, 1}, n = 5, sw = 0;
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; sw++; }
    printf("%d", sw);
}
```

**Q20.3**  `Output · 2M`  What does the program print?

```c
int main() {
    int a[3][3] = {{1,2,3},{4,5,6},{7,8,9}};
    for (int i = 0; i < 3; i++)
        for (int j = 0; j < 3; j++) {
            int t = a[i][j]; a[i][j] = a[j][i]; a[j][i] = t;
        }
    for (int i = 0; i < 3; i++) printf("%d%d%d ", a[i][0], a[i][1], a[i][2]);
}
```

**Q20.4**  `Output · 2M`  What is printed? (inorder and preorder of a BST built by inserting 5, 3, 8, 1, 4)

```c
struct N { int k; struct N *l, *r; };
struct N *ins(struct N *t, int k) {
    if (!t) { t = calloc(1, sizeof *t); t->k = k; return t; }
    if (k < t->k) t->l = ins(t->l, k); else t->r = ins(t->r, k);
    return t;
}
void in(struct N *t)  { if (t) { in(t->l);  printf("%d", t->k); in(t->r); } }
void pre(struct N *t) { if (t) { printf("%d", t->k); pre(t->l); pre(t->r); } }
int main() {
    struct N *root = NULL; int v[] = {5, 3, 8, 1, 4};
    for (int i = 0; i < 5; i++) root = ins(root, v[i]);
    in(root); printf(" "); pre(root);
}
```

**Q20.5**  `Output · 1M`  What does `f` print for the list 1→2→3→4?

```c
struct node { int d; struct node *next; };
struct node *rev(struct node *h) {
    struct node *prev = NULL, *cur = h, *nx;
    while (cur) { nx = cur->next; cur->next = prev; prev = cur; cur = nx; }
    return prev;
}
int main() {
    struct node *h = NULL, *t;
    for (int i = 4; i >= 1; i--) { t = malloc(sizeof *t); t->d = i; t->next = h; h = t; }
    h = rev(h);
    for (t = h; t; t = t->next) printf("%d", t->d);
}
```

**Q20.6**  `NAT · 2M`  How many primes are printed/counted (Sieve of Eratosthenes up to 50)?

```c
int main() {
    char comp[51] = {0};
    int cnt = 0;
    for (int i = 2; i <= 50; i++) {
        if (!comp[i]) {
            cnt++;
            for (int j = 2 * i; j <= 50; j += i) comp[j] = 1;
        }
    }
    printf("%d", cnt);
}
```

**Q20.7**  `NAT · 2M`  What does `f(6)` return? (Collatz steps)

```c
int f(int n) {
    int c = 0;
    while (n > 1) { n = (n % 2) ? 3 * n + 1 : n / 2; c++; }
    return c;
}
int main() { printf("%d", f(6)); }
```

**Q20.8**  `Output · 2M`  Array stack operations: what is printed?

```c
int st[10], top = -1;
void push(int x) { st[++top] = x; }
int  pop(void)   { return st[top--]; }
int main() {
    push(1); push(2); push(3);
    printf("%d ", pop());
    push(4);
    printf("%d ", pop());
    int a = pop();
    int b = pop();
    printf("%d %d", a, b);
}
```

**Q20.9**  `MCQ · 1M`  A circular queue of capacity 5 uses `rear = (rear + 1) % 5` for insertion and `front = (front + 1) % 5` for deletion, starting with `front = rear = 0` (queue empty when `front == rear`). After 4 insertions and 2 deletions, the number of elements is:

- (A) 1
- (B) 2
- (C) 3
- (D) 4

**Q20.10**  `Output · 1M`  What is the output?

```c
int main() {
    int a[] = {3, 0, 1, 2}, i = 0, c = 0;
    do { i = a[i]; c++; } while (i != 0);
    printf("%d", c);
}
```

### Answer Key — Chapter 20

- **20.1** — Output: `3` ✅ — Probes: mid = (0+15)/2 = 7 → lo = 8; mid = (8+15)/2 = 11 → lo = 12; mid = (12+15)/2 = 13 → found. 3 iterations.
- **20.2** — Output: `10` ✅ — Swaps = number of inversions = 5·4/2 = 10 for a reverse-sorted array.
- **20.3** — Output: `123 456 789` ✅ — Each off-diagonal pair is swapped twice (once from each triangle), restoring the original matrix.
- **20.4** — Output: `13458 53148` ✅ — Inorder of a BST is sorted; preorder visits root first: 5, then left subtree (3,1,4), then 8.
- **20.5** — Output: `4321` ✅ — Standard iterative reversal.
- **20.6** — Output: `15` ✅ — Primes ≤ 50: 2,3,5,7,11,13,17,19,23,29,31,37,41,43,47.
- **20.7** — Output: `8` ✅ — 6→3→10→5→16→8→4→2→1: 8 steps.
- **20.8** — Output: `3 4 2 1` ✅ — push 1,2,3; pop → 3; push 4; pop → 4; then pop → 2, pop → 1. (Never write two `pop()` calls inside one `printf` — argument evaluation order is unspecified.)
- **20.9** — **(B)** — 4 − 2 = 2. (Note: with the `front == rear` empty test the queue can hold at most 4 elements.)
- **20.10** — Output: `4` ✅ — i: 0→3→2→1→0 — four iterations.


---

## Chapter 21 — Mixed Timed Mock Test (Chapters 1–20)


**Instructions:** 16 questions, 25 marks, **about 45 minutes** (GATE pace ≈ 1.8 min per mark). Attempt without looking at the answer key. Assume a typical GATE-style machine unless stated: `char` 1, `short` 2, `int` 4, `long` 8, pointer 8, little-endian, two's complement, ASCII. After the test, log every wrong answer in your Mistake Notebook (template in Chapter 22).

### Practice Questions — Chapter 21  *(16 questions, 25 marks)*

**Q21.1**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 5, *p = &x;
    printf("%d", *p ** p + 1);
}
```

**Q21.2**  `Output · 1M`  What is the output?

```c
int main() {
    int a = 1, b = 2, c = 3;
    printf("%d", a < b && b < c || !a);
}
```

**Q21.3**  `Output · 2M`  What is the output?

```c
int f(int n) {
    static int c = 0;
    if (n == 0) return c;
    c += n;
    return f(n - 1);
}
int main() { printf("%d", f(4)); }
```

**Q21.4**  `Output · 1M`  What is the output?

```c
int main() {
    char *s = "GATE2027";
    printf("%c", *(s + strlen(s) / 2));
}
```

**Q21.5**  `Output · 2M`  What is the output?

```c
int main() {
    int a[3][3] = {1,2,3,4,5,6,7,8,9};
    int (*p)[3] = a;
    printf("%d", (*(p + 1))[2] + p[2][0]);
}
```

**Q21.6**  `Output · 2M`  What is the output?

```c
void f(int *a, int n) {
    if (n == 0) return;
    f(a + 1, n - 1);
    printf("%d", *a);
}
int main() { int a[] = {1, 2, 3}; f(a, 3); }
```

**Q21.7**  `Output · 2M`  What does `f(255)` return?

```c
int f(int x) { return x ? 1 + f(x & (x - 1)) : 0; }
int main() { printf("%d", f(255)); }
```

**Q21.8**  `Output · 2M`  What is the output?

```c
int main() {
    for (int i = 0; i < 3; i++) {
        switch (i) {
            case 0: continue;
            case 1: printf("a");
            case 2: printf("b"); break;
        }
        printf("c");
    }
}
```

**Q21.9**  `Output · 1M`  What is the output?

```c
int main() {
    char *p = "GATE";
    char *q = p + 3;
    printf("%ld %c", q - p, *q);
}
```

**Q21.10**  `Output · 1M`  What is the output?

```c
int main() {
    int a[3][4];
    printf("%zu %zu", sizeof(a) / sizeof(a[0]), sizeof(a[0]) / sizeof(a[0][0]));
}
```

**Q21.11**  `Output · 1M`  What is the output?

```c
int main() {
    int x = 2;
    x <<= 3 + 1;
    printf("%d", x);
}
```

**Q21.12**  `MCQ · 2M`  What is wrong with the loop `for (unsigned i = 3; i >= 0; i--) { ... }`?

- (A) Nothing
- (B) Infinite loop: an unsigned value is always ≥ 0 and wraps around
- (C) It executes 0 times
- (D) Compile-time error

**Q21.13**  `MCQ · 2M`  Which of the following is **not** a valid way to access element `(i, j)` of `int m[R][C]` (in-bounds)?

- (A) `m[i][j]`
- (B) `*(*(m + i) + j)`
- (C) `*(m[i] + j)`
- (D) `*(m + i * C + j)`

**Q21.14**  `Output · 1M`  What is the output?

```c
int main() {
    int i = 0;
    int a[3] = {10, 20, 30};
    int s = 0;
    s += a[i++];
    s += a[i++];
    s += a[i++];
    printf("%d %d", s, i);
}
```

**Q21.15**  `Output · 2M`  Assume natural alignment. What is `sizeof(struct S)`?

```c
struct S { char c; long l; short s; };
int main() { printf("%zu", sizeof(struct S)); }
```

**Q21.16**  `Output · 2M`  What is the output?

```c
#define DOUBLE(x) x + x
int main() { printf("%d", DOUBLE(3) * DOUBLE(3)); }
```

### Answer Key — Chapter 21

- **21.1** — Output: `26` ✅ — `*p ** p` = `(*p) * (*p)` = 25; +1 → 26.
- **21.2** — Output: `1` ✅ — `(1 && 1) || 0` = 1.
- **21.3** — Output: `10` ✅ — `c` accumulates 4+3+2+1 = 10 and is returned at the base case.
- **21.4** — Output: `2` ✅ — `strlen` = 8 → index 4 → `'2'`.
- **21.5** — Output: `13` ✅ — `(*(p+1))[2]` = a[1][2] = 6; `p[2][0]` = 7 → 13.
- **21.6** — Output: `321` ✅ — Printing happens after the recursive call, so elements print in reverse.
- **21.7** — Output: `8` ✅ — Counts set bits recursively: 8.
- **21.8** — Output: `abcbc` ✅ — i=0: `continue`. i=1: prints a, falls into b, `break`, then c. i=2: prints b, break, then c.
- **21.9** — Output: `3 E` ✅ — Pointer difference is 3 elements; `*q` is `'E'`.
- **21.10** — Output: `3 4` ✅ — Number of rows and number of columns.
- **21.11** — Output: `32` ✅ — `x <<= 3+1` is `x = x << 4` = 32.
- **21.12** — **(B)** — After i = 0, `i--` wraps to UINT_MAX, which is still ≥ 0.
- **21.13** — **(D)** — `m + i*C + j` moves by *rows* (each of C ints), not by ints, and `*` of it yields an array that decays — wrong type/offset. Use `*(*m + i*C + j)` for flat access.
- **21.14** — Output: `60 3` ✅ — Three separate statements — each `i++` is sequenced. s = 10 + 20 + 30.
- **21.15** — Output: `24` ✅ — c@0, pad 7, l@8, s@16, pad 6 (to a multiple of 8) = 24.
- **21.16** — Output: `15` ✅ — `3 + 3 * 3 + 3` = 3 + 9 + 3 = 15.


---

## Chapter 22 — Revision Pack: Tracing Method, Traps, Micro-Rules, Cheat-Sheet, Mistake Notebook


### 22.1 The 10-step GATE code-tracing method
Use this on **every** C code question:
1. Write the initial values.
2. Identify scopes (globals, shadowing, `static`).
3. Identify **types** of every variable and sub-expression.
4. Resolve parentheses.
5. Resolve precedence and associativity.
6. Check evaluation order / side effects (any UB? unsequenced `++`?).
7. Check array bounds.
8. Check pointer validity (initialized, non-NULL, live object).
9. Check integer overflow / type conversion / promotion.
10. **Only then** compute the output.

> Don't ask "What is the output?" first. Ask **"Is this code even well-defined?"** — that one habit saves marks.

### 22.2 The 30 most dangerous traps
1. Array ≠ pointer
2. `sizeof(array)` ≠ `sizeof(pointer)` (also for array parameters)
3. `strlen` ≠ `sizeof`
4. `i++` ≠ `++i`
5. `*p++` ≠ `(*p)++`
6. `*++p` ≠ `++*p`
7. `struct` ≠ `union`
8. scope ≠ lifetime
9. scope ≠ linkage
10. `static` local ≠ ordinary local
11. `malloc` ≠ `calloc`
12. `NULL` ≠ `'\0'` ≠ `"0"` ≠ `'0'`
13. assignment `=` ≠ comparison `==`
14. `&&` ≠ `&`
15. `||` ≠ `|`
16. `!` ≠ `~`
17. `break` ≠ `continue`
18. `while` ≠ `do-while`
19. Pointer arithmetic is **type-scaled**
20. Signed overflow → UB (unsigned wraps)
21. Out-of-bounds access → UB
22. Unsequenced side effects → UB
23. Evaluation order is not always left-to-right
24. Structure padding exists (`sizeof` ≥ sum of members)
25. Arguments are passed **by value**
26. The pointer itself is passed by value (reassigning it inside a function is invisible outside)
27. Macro expansion changes meaning (parenthesize; side effects repeated)
28. `realloc` may move memory
29. A freed pointer dangles
30. Not every non-zero value is 1 — but `! < > == != && ||` always yield exactly 0 or 1

Extra traps worth adding to your list: `x & 1 == 0` precedence; `a+++b`; `'A'` is `int`; unsigned-vs-signed comparison; `strlen` returns unsigned; `for(...);` empty body; `switch` fall-through and `default` in the middle; dangling `else`; `%c` after `%d` in `scanf`; `while(!feof(fp))`; `char` signedness; float `==`; `printf` returns a count; integer division/modulo with negatives.

### 22.3 The 20 must-memorize micro-rules
1. `a[i] = *(a + i)` 2. `i[a] = a[i]` 3. `p[i] = *(p + i)`
4. `p + 1` moves by the size of the pointed-to type
5. `sizeof(array)` = total array storage; 6. `sizeof(pointer)` = pointer storage
7. `strlen` excludes `'\0'`; 8. `sizeof("literal")` includes `'\0'`
9. 0 → false, non-zero → true
10. `&&` and `||` short-circuit
11. C passes arguments by value
12. `static` local retains its value
13. Struct members have separate storage; 14. union members share storage
15. `malloc` → uninitialized; 16. `calloc` → zeroed
17. `free` → lifetime ends
18. Array indexing starts at 0
19. `do-while` executes at least once
20. `break` exits the nearest loop/switch

### 22.4 Mental-model layers (apply to every question)
`VALUE → TYPE → ADDRESS → LIFETIME → SCOPE → LINKAGE → EVALUATION ORDER → DEFINED / UNSPECIFIED / IMPLEMENTATION-DEFINED / UNDEFINED`

### 22.5 One-page cheat-sheet
**Sizes (typical):** char 1, short 2, int 4, long 4/8, long long 8, float 4, double 8, pointer 4/8.
**Ranges:** unsigned `0..2ⁿ−1`; signed `−2ⁿ⁻¹..2ⁿ⁻¹−1`; `~x = −x−1`.
**Precedence (short):** `() [] -> . post++` > `unary ! ~ * & sizeof (cast) pre++` > `* / %` > `+ -` > `<< >>` > `< <= > >=` > `== !=` > `&` > `^` > `|` > `&&` > `||` > `?:` > `= op=` > `,`.
**Division/modulo:** truncate toward zero; `%` takes sign of dividend.
**Conversions:** int→float: float; float→double: double; signed+unsigned (same rank) → unsigned; float→int truncates.
**Address of `A[i][j]`:** `B + (i·C + j)·w`; 3-D: `B + ((i·Y + j)·Z + k)·w`.
**Pointer arithmetic:** `p ± n` → `± n·sizeof(*p)`; `p − q` → elements.
**Bit tricks:** `x&(x−1)` clears lowest 1; `x&−x` isolates lowest 1; power of two ⇔ `x>0 && !(x&(x−1))`; `a+b = (a^b) + 2(a&b)`.
**Padding:** align each member to its size; round total to the largest alignment. **Union:** max member, rounded to max alignment.
**Strings:** `strlen` ≠ `sizeof`; `"abc"[i]`; modifying a literal = UB; `strcmp == 0` for equality.
**printf:** returns #chars; `%d %u %ld %lld %zu %f %c %s %x %o %p`; wrong specifier = UB.
**scanf:** needs `&`; returns #items; `%c` reads whitespace; use `" %c"`.
**Recursion:** frames = depth; `T(n)=T(n−1)+1 → n`; `2T(n−1)+1 → 2ⁿ`; `T(n/2)+1 → log n`; `2T(n/2)+n → n log n`; fib calls `C(n) = 1 + C(n−1) + C(n−2)`.
**Loops:** `i*=2` → log₂; nested triangular → n(n−1)/2; harmonic-type loops → n log n.
**Dynamic memory:** `malloc/calloc/realloc/free`; leaks, dangling, double free; `realloc` via temp pointer.
**Macros:** expand textually; parenthesize; `#`, `##`; side effects repeated.
**UB list:** overflow(signed), OOB, NULL/dangling/wild deref, `/0`, unsequenced modification, shift ≥ width, string-literal write, bad format specifier, double free.

### 22.6 Master study tree (tick each box)
- [ ] **A. Fundamentals** — structure, tokens, keywords, identifiers, constants, variables, data types, modifiers, qualifiers (Ch 1–2)
- [ ] **B. Operators** — arithmetic, relational, logical, assignment, inc/dec, conditional, bitwise, comma, sizeof, precedence, associativity (Ch 3, 5)
- [ ] **C. Conversions & UB** — implicit/explicit, promotions, usual arithmetic conversions, UB/unspecified/impl-defined, sequence points (Ch 4, 6)
- [ ] **D. Control flow** — if, nested if, switch/fall-through, for, while, do-while, break, continue, goto (Ch 7)
- [ ] **E. I/O** — printf, scanf, format specifiers, return values, getchar/putchar, files, command line (Ch 8, 19)
- [ ] **F. Functions** — declaration, definition, parameters, return, pass-by-value, pointer parameters, recursion, function pointers (Ch 9, 13)
- [ ] **G. Storage & scope** — auto, static, extern, register, scope, lifetime, linkage, declaration vs definition (Ch 10)
- [ ] **H. Arrays** — 1-D, 2-D, multi-D, row-major, indexing, decay, array vs pointer, sizeof (Ch 11)
- [ ] **I. Pointers** — `&`, `*`, arithmetic, subtraction, comparison, pointer-to-pointer, void/NULL/wild/dangling, array of pointers, pointer to array, function pointer (Ch 12–13)
- [ ] **J. Strings** — char arrays, `'\0'`, literals, `strlen/strcpy/strncpy/strcat/strcmp`, pointer relationship (Ch 14)
- [ ] **K. Struct / union** — declaration, `.` vs `->`, padding, alignment, union, struct vs union, typedef, enum, bit-fields (Ch 15)
- [ ] **L. Dynamic memory** — malloc/calloc/realloc/free, leaks, dangling, dynamic arrays and 2-D arrays, linked structures (Ch 16, 20)
- [ ] **M. Preprocessor** — `#include`, `#define`, macros, expansion, conditional compilation (Ch 17)
- [ ] **N. Advanced** — const, volatile, restrict, aliasing, alignment, object lifetime, memory model, stack frames (Ch 13, 18)

### 22.7 How GATE typically asks C (patterns to practise)
1. **Output tracing** with pointers + arrays (`*p++`, 2-D arrays, `a[i][j] ≡ *(*(a+i)+j)`).
2. **Recursion tracing** (print before/after recursive call; return values; counting calls).
3. **Static / scope / lifetime** (`static` counters, shadowing, globals).
4. **Operators & side effects** (`++`, `&&`/`||` short-circuit, comma, ternary, precedence traps).
5. **`sizeof` / struct padding / union size / array address calculation** (NAT).
6. **Macros** with side effects or missing parentheses.
7. **Strings** (`strlen`, loops with `*s++`, in-place reversal, palindromes).
8. **Bit manipulation** (`x & (x−1)`, shifts, XOR tricks).
9. **Linked list / array / matrix routines** (what does this function do? number of iterations?).
10. **UB-detection** ("which of the following is true?" statements about C semantics).

### 22.8 Your 4-notebook system
| Notebook | Purpose |
|---|---|
| 📘 **1 — Concepts** | This file's Chapters 1–20 (concept parts) |
| 📕 **2 — Practice + PYQs** | For every topic: concept → 10–20 basic → 10–20 GATE-level → PYQs → timed mixed set. Don't peek at solutions immediately |
| 📓 **3 — Mistake Notebook** | One entry per wrong/lucky answer (template below) |
| 📗 **4 — Formula + Revision + Shortcuts** | Only rules, identities, pointer relationships, precedence, bit tricks, complexity patterns, traps, PYQ patterns → becomes your 30–60 minute final revision |

**Mistake-notebook template (copy for each mistake):**
```
Question:
My answer:
Correct answer:
Why I was wrong:
Concept tested:
Trap:
Correct rule:
How I will recognize it next time (trigger):
Date re-solved / result:
```
*Example —* **Mistake:** treated `sizeof(a)` as `sizeof(pointer)`. **Correct rule:** an array decays to a pointer in expressions, but *not* as the operand of `sizeof` (or `&`). **Trigger:** whenever I see `sizeof(array)`, STOP and check whether it is a real array or a function parameter.

### 22.9 Strategy
**Learn → Solve → Analyze → Record mistakes → Re-solve → Revise.** Don't try to finish by reading once. For every code question — especially PYQs — first check *well-definedness*, then trace with the 10-step method. Revisit the Mistake Notebook weekly, and re-attempt Chapter 21's mock after 7 and 21 days.


---

*End of notebook. Good luck — target: zero silly mistakes in C.*
