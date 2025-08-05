# LaTeX Examples for Quiz Questions

## Basic Usage

### Inline Math (use single $ or \( \))
- Simple equation: `$x^2 + y^2 = z^2$`
- Fraction: `$\frac{a}{b}$`
- Square root: `$\sqrt{x}$`
- Subscript: `$H_2O$`

### Display Math (use double $$ or \[ \])
- Matrix: `$$\begin{bmatrix} 4 & 3 \\ 3 & 2 \end{bmatrix}$$`
- Complex equation: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`
- Summation: `$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$`

## Example Quiz Questions

### Question 1: Algebra
**Question:** What is the solution to the quadratic equation $ax^2 + bx + c = 0$?

**Options:**
- A) $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
- B) $x = \frac{b \pm \sqrt{b^2 + 4ac}}{2a}$
- C) $x = \frac{-b \pm \sqrt{b^2 + 4ac}}{2a}$
- D) $x = \frac{b \pm \sqrt{b^2 - 4ac}}{2a}$

### Question 2: Matrix
**Question:** What is the determinant of the matrix $\begin{bmatrix} 2 & 3 \\ 1 & 4 \end{bmatrix}$?

**Options:**
- A) $5$
- B) $8$
- C) $11$
- D) $-5$

### Question 3: Calculus
**Question:** What is $\frac{d}{dx}(x^3 + 2x^2 - 5x + 1)$?

**Options:**
- A) $3x^2 + 4x - 5$
- B) $x^3 + 2x^2 - 5x$
- C) $3x^2 + 2x - 5$
- D) $\frac{x^4}{4} + \frac{2x^3}{3} - \frac{5x^2}{2} + x$

## How to Use in Admin Dashboard

1. Go to Admin Dashboard → Questions tab
2. In the Question field, type: `What is the value of $x$ in $2x + 5 = 15$?`
3. In Option fields, type:
   - Option 1: `$x = 5$`
   - Option 2: `$x = 10$`
   - Option 3: `$x = 7.5$`
   - Option 4: `$x = -5$`
4. Set correct answer to match one of the options
5. Save the question

The LaTeX will be rendered properly in both the admin preview and the actual quiz!