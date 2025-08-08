// Chorcha Question Extractor - Bookmarklet Version
// Copy this entire code and create a bookmark with it as the URL

javascript:(function(){
    function extractChorchaQuestions() {
        const questions = [];
        console.log('Starting extraction...');
        
        let questionContainers = document.querySelectorAll('div.space-y-4 > div.rounded-xl');
        if (questionContainers.length === 0) {
            questionContainers = document.querySelectorAll('div.rounded-xl');
        }
        
        questionContainers.forEach((container, index) => {
            try {
                if (index % 10 === 0) console.log(`Processing question ${index + 1}...`);
                
                let questionArea = container.querySelector('div.space-y-2.md\\:space-y-3') || 
                                 container.querySelector('div.space-y-2');
                if (!questionArea) return;
                
                const questionDiv = questionArea.querySelector('div.flex-grow');
                if (!questionDiv) return;
                
                let questionText = questionDiv.textContent.trim();
                if (!questionText) return;
                
                let optionButtons = container.querySelectorAll('div.grid.md\\:grid-cols-2.gap-1 button') ||
                                  container.querySelectorAll('button[type="button"]');
                
                const options = {};
                let correctAnswer = '';
                
                optionButtons.forEach(button => {
                    const optionDiv = button.querySelector('div.rounded-full');
                    let optionContent = button.querySelector('div.text-left.overflow-x-auto') ||
                                      button.querySelector('p');
                    
                    if (optionDiv && optionContent) {
                        const optionLetter = optionDiv.textContent.trim();
                        const optionText = optionContent.textContent.trim();
                        
                        if (optionLetter.match(/[কখগঘ]/)) {
                            options[optionLetter] = optionText;
                            if (optionDiv.classList.contains('skipped')) {
                                correctAnswer = optionText;
                            }
                        }
                    }
                });
                
                const explanationDiv = container.querySelector('div.p-3.rounded-lg.bg-green-200\\/25');
                const explanation = explanationDiv ? explanationDiv.textContent.trim() : '';
                
                if (questionText && Object.keys(options).length >= 2) {
                    questions.push({
                        question: questionText,
                        options: options,
                        correctAnswer: correctAnswer,
                        explanation: explanation
                    });
                }
            } catch (error) {
                console.log(`Error processing question ${index + 1}:`, error);
            }
        });
        
        return questions;
    }
    
    const questions = extractChorchaQuestions();
    const formattedText = questions.map(q => {
        const optionsText = Object.entries(q.options)
            .map(([letter, text]) => `${letter}. ${text}`)
            .join('\n');
        return `${q.question}\n${optionsText}\nCorrect Answer: ${q.correctAnswer}\nExplanation: ${q.explanation}`;
    }).join('\n\n---\n\n');
    
    // Create a popup with the results
    const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    popup.document.write(`
        <html>
        <head><title>Extracted Questions (${questions.length})</title></head>
        <body style="font-family: Arial; padding: 20px;">
            <h2>Extracted ${questions.length} Questions</h2>
            <button onclick="navigator.clipboard.writeText(document.getElementById('questions').textContent); alert('Copied!');" 
                    style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
                Copy All Questions
            </button>
            <pre id="questions" style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${formattedText}</pre>
        </body>
        </html>
    `);
})();