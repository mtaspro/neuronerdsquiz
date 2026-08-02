import MotivationalMessage, { MotivationalSequence } from '../models/MotivationalMessage.js';
import axios from 'axios';

class MotivationalMessageService {
  constructor() {
    this.messages = [];
    this.isInitialized = false;
    this.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    this.DU_ADMISSION_DATE = '2026-12-10';
    this.FALLBACK_MODELS = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free'
    ];
  }

  async initializeMessages() {
    try {
      this.isInitialized = true;
      console.log('✅ Motivational message service initialized (AI-generated for DU Admission)');
    } catch (error) {
      console.error('❌ Error initializing motivational messages:', error);
    }
  }

  getCurrentDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  calculateDaysUntilAdmission(dateString) {
    const target = new Date(this.DU_ADMISSION_DATE);
    const current = new Date(dateString + 'T00:00:00');
    const diff = target - current;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getCategoryForDaysRemaining(daysRemaining) {
    if (daysRemaining <= 0) return 'finale';
    if (daysRemaining <= 7) return 'final_push';
    if (daysRemaining <= 30) return 'motivation';
    if (daysRemaining <= 90) return 'progress';
    return 'opening';
  }

  getNextExam(daysRemaining) {
    if (daysRemaining <= 0) return null;
    return 'Dhaka University Admission Test';
  }

  buildSystemPrompt() {
    const customPrompt = process.env.DU_MOTIVATIONAL_SYSTEM_PROMPT;
    if (customPrompt) return customPrompt;

    return `You are NeuraX, an expert motivational writer for Dhaka University Admission test aspirants.

Your task: Generate a single, short, punchy motivational message for a student preparing for the Dhaka University Admission Test (December 10, 2026).

Schema context:
- date: YYYY-MM-DD
- examsRemaining: days until admission test
- nextExam: upcoming exam name or null
- category: one of [opening, progress, motivation, funny, celebration, final_push, finale, study_tip, unit_based, subject_focus]
- message: the motivational text (max 150 words, mix of English and Bengali naturally, use emojis, be witty and relatable)

Message guidelines:
- Max 150 words
- Mix English and Bengali naturally
- Use emojis
- Be witty, relatable, and energetic
- Reference the specific context (days remaining, upcoming exams)
- No JSON, no meta-commentary, no reasoning tags
- Output ONLY the message text`;
  }

  buildUserPrompt(context) {
    const toneMap = {
      'finale': 'celebratory and emotional',
      'final_push': 'urgent and determined',
      'motivation': 'encouraging and energetic',
      'progress': 'steady and confident',
      'opening': 'inspiring and exciting',
      'celebration': 'joyful and proud',
      'funny': 'humorous and lighthearted',
      'study_tip': 'helpful and focused',
      'unit_based': 'analytical and strategic',
      'subject_focus': 'clear and targeted'
    };

    return `Generate a motivational message for:
Date: ${context.date}
Days until DU Admission: ${context.examsRemaining}
Next exam: ${context.nextExam || 'None'}
Category: ${context.category}
Tone: ${toneMap[context.category] || 'encouraging and energetic'}`;
  }

  async callOpenRouterWithFallback(messages) {
    const models = this.FALLBACK_MODELS;

    for (const model of models) {
      try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: model,
          messages: messages,
          max_tokens: 200,
          temperature: 0.8
        }, {
          headers: {
            'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://neuronerds-quiz.com',
            'X-Title': 'NeuraX Motivational Messages'
          },
          timeout: 30000
        });

        const content = response.data.choices[0]?.message?.content;
        if (content && content.trim()) {
          return { content, model };
        }
      } catch (error) {
        console.error(`❌ OpenRouter model ${model} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All OpenRouter models failed');
  }

  async generateAIMessage(context) {
    const systemPrompt = this.buildSystemPrompt();
    let userPrompt = this.buildUserPrompt(context);

    try {
      const previousMessages = await MotivationalMessage.find({})
        .sort({ date: -1 })
        .limit(5)
        .lean();

      if (previousMessages.length > 0) {
        const history = previousMessages
          .reverse()
          .map(m => `${m.date} (${m.examsRemaining} days left, ${m.category}): "${m.message.substring(0, 100)}${m.message.length > 100 ? '...' : ''}"`)
          .join('\n');

        userPrompt += `\n\nRecent message history for continuity:\n${history}\n\nMaintain the same energetic NeuraX tone and build on the narrative arc.`;
      }
    } catch (error) {
      console.error('⚠️ Could not load previous messages for context:', error.message);
    }

    const result = await this.callOpenRouterWithFallback([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    let message = result.content.trim();

    message = message.replace(/<think>[\s\S]*?<\/think>/g, '');
    message = message.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
    message = message.replace(/<[^>]*>/g, '');

    return {
      message: message,
      aiModel: result.model,
      generatedPrompt: userPrompt
    };
  }

  async getMessageForDate(dateString = null) {
    try {
      const targetDate = dateString || this.getCurrentDateString();
      const daysRemaining = this.calculateDaysUntilAdmission(targetDate);
      const category = this.getCategoryForDaysRemaining(daysRemaining);
      const nextExam = this.getNextExam(daysRemaining);

      let cachedMessage = await MotivationalMessage.findOne({ date: targetDate });

      if (cachedMessage && cachedMessage.isReusable && cachedMessage.generatedByAI) {
        return {
          message: cachedMessage.message,
          examsRemaining: cachedMessage.examsRemaining,
          nextExam: cachedMessage.nextExam,
          category: cachedMessage.category,
          date: cachedMessage.date,
          generatedByAI: cachedMessage.generatedByAI
        };
      }

      const context = {
        date: targetDate,
        examsRemaining: daysRemaining,
        nextExam: nextExam,
        category: category,
        tone: category === 'finale' ? 'celebratory and emotional' :
              category === 'final_push' ? 'urgent and determined' :
              category === 'funny' ? 'humorous and lighthearted' : 'encouraging'
      };

      let aiResult;
      try {
        aiResult = await this.generateAIMessage(context);
      } catch (error) {
        console.error('❌ AI generation failed, using fallback:', error.message);
        return this.getFallbackMessage(targetDate, daysRemaining, category, nextExam);
      }

      const messageDoc = {
        date: targetDate,
        message: aiResult.message,
        examsRemaining: daysRemaining,
        nextExam: nextExam,
        category: category,
        generatedByAI: true,
        aiModel: aiResult.aiModel,
        generatedPrompt: aiResult.generatedPrompt,
        isReusable: true
      };

      if (cachedMessage) {
        await MotivationalMessage.findByIdAndUpdate(cachedMessage._id, messageDoc);
      } else {
        await MotivationalMessage.create(messageDoc);
      }

      return {
        message: aiResult.message,
        examsRemaining: daysRemaining,
        nextExam: nextExam,
        category: category,
        date: targetDate,
        generatedByAI: true
      };
    } catch (error) {
      console.error('❌ Error getting motivational message:', error);
      return this.getFallbackMessage(dateString || this.getCurrentDateString());
    }
  }

  getFallbackMessage(dateString, examsRemaining = null, category = 'motivation', nextExam = null) {
    if (!examsRemaining) {
      const today = new Date(dateString + 'T00:00:00');
      const admission = new Date(this.DU_ADMISSION_DATE);
      examsRemaining = Math.max(0, Math.ceil((admission - today) / (1000 * 60 * 60 * 24)));
    }

    const fallbacks = {
      'finale': "🎉 DU Admission test is over! Congratulations! You did it!",
      'final_push': `🔥 Only ${examsRemaining} days left! You're almost there!`,
      'motivation': `💪 ${examsRemaining} days to go. Keep pushing forward!`,
      'progress': `📚 ${examsRemaining} days remaining. Every day counts!`,
      'opening': `🚀 ${examsRemaining} days until DU Admission. The journey begins now!`,
      'celebration': `🎉 Keep it up! ${examsRemaining} days to go!`,
      'funny': `😄 ${examsRemaining} days left. Stay sane!`,
      'study_tip': `📖 ${examsRemaining} days. Study smart!`,
      'unit_based': `🎯 ${examsRemaining} days. Master your units!`,
      'subject_focus': `📝 ${examsRemaining} days. Focus on your subjects!`
    };

    return {
      message: fallbacks[category] || fallbacks['motivation'],
      examsRemaining,
      nextExam,
      category,
      date: dateString,
      generatedByAI: false
    };
  }

  async getTodayMessage() {
    return this.getMessageForDate();
  }

  async getAllMessages() {
    try {
      return await MotivationalMessage.find({}).sort({ date: 1 });
    } catch (error) {
      console.error('❌ Error getting all messages:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const total = await MotivationalMessage.countDocuments();
      const categories = await MotivationalMessage.distinct('category');

      return {
        total,
        categories,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('❌ Error getting motivational message stats:', error);
      return { total: 0, categories: [], isInitialized: false };
    }
  }
}

export default MotivationalMessageService;
