# 🤖 AI LaTeX Generator - Usage Guide

## ✅ Implementation Complete!

The AI LaTeX Generator has been successfully integrated into your Admin Dashboard.

## 🎯 Features

### **AI-Powered LaTeX Generation**
- **Input**: Plain text description of math formulas
- **Output**: Clean LaTeX code (no explanations, just the formula)
- **Model**: Qwen 3.5 235B (via OpenRouter API)

### **Live Preview**
- **MathJax Rendering**: See exactly how the LaTeX will look
- **Real-time Preview**: Instant visual feedback
- **Dark Mode Support**: Works in both light and dark themes

### **Easy Integration**
- **Copy Code**: Copy LaTeX to clipboard
- **Insert into Question**: Directly insert into question field
- **Error Handling**: Clear error messages for failed generations

## 🚀 How to Use

### **Step 1: Access AI Generator**
1. Go to **Admin Dashboard → Questions Tab**
2. You'll see the **AI LaTeX Generator** at the top (purple/blue gradient box)

### **Step 2: Generate LaTeX**
1. **Type your description** in plain text:
   ```
   "quadratic formula"
   "integral of x squared from 0 to 1"
   "2x2 matrix with elements a, b, c, d"
   "square root of x plus y"
   ```

2. **Click "Generate LaTeX"** button
3. **Wait for AI response** (usually 2-3 seconds)

### **Step 3: Use the Result**
- **View the LaTeX code** in the gray code box
- **See live preview** rendered with MathJax
- **Copy the code** or **Insert into Question** directly

## 📝 Example Usage

### **Input Examples:**
```
"solve for x in ax squared plus bx plus c equals zero"
→ Generates: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

"derivative of sine x"
→ Generates: $\frac{d}{dx}\sin(x) = \cos(x)$

"3 by 3 identity matrix"
→ Generates: $\begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix}$
```

## 🔧 Technical Details

### **API Endpoint**
- **Route**: `POST /api/latex/generate`
- **Body**: `{ "text": "your description here" }`
- **Response**: `{ "latex": "generated LaTeX code" }`

### **Error Handling**
- **Invalid input**: "Text input is required"
- **API errors**: Shows specific error message
- **Network issues**: "Failed to generate LaTeX"

### **Environment Variables**
- **OPENROUTER_API_KEY**: Already configured in your .env file
- **Model**: `qwen/qwen3-235b-a22b:free`

## 🎨 UI Features

### **Visual Design**
- **Purple/Blue gradient** background
- **Robot icon** for AI branding
- **Loading spinner** during generation
- **Smooth animations** with Framer Motion

### **Responsive Design**
- **Mobile-friendly** layout
- **Dark mode** compatible
- **Accessible** color contrasts

## 🚀 Ready to Use!

Your AI LaTeX Generator is now live and ready! Admins can:

1. **Describe math formulas** in plain English
2. **Generate clean LaTeX** with AI
3. **Preview the result** instantly
4. **Insert directly** into quiz questions

This will make creating math-rich quiz questions much faster and easier! 🎯

## 🔮 Future Enhancements

- **Option selection**: Generate LaTeX for multiple choice options
- **Batch generation**: Multiple formulas at once
- **Formula templates**: Common math patterns
- **History**: Save previously generated formulas