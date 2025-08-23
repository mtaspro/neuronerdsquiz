import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import DOMPurify from 'dompurify';
import * as Yup from 'yup';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import { secureStorage } from '../utils/secureStorage';
import MathText from '../components/MathText';
import AILatexGenerator from '../components/AILatexGenerator';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300">
          Something went wrong: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

// Validation Schemas
const questionSchema = Yup.object().shape({
  question: Yup.string().required('Question text is required').min(5, 'Question must be at least 5 characters'),
  options: Yup.array()
    .of(Yup.string().required('Option cannot be empty'))
    .min(2, 'At least two options required'),
  correctAnswer: Yup.number().min(0).max(3).required('Correct answer index required'),
  chapter: Yup.string().required('Chapter is required'),
  duration: Yup.number().min(1, 'Duration must be positive').required('Duration required'),
  explanation: Yup.string(),
});

const subjectSchema = Yup.object().shape({
  name: Yup.string().required('Subject name is required').min(2),
  description: Yup.string(),
  order: Yup.number().min(0).required('Order required'),
  visible: Yup.boolean(),
});

const chapterSchema = Yup.object().shape({
  name: Yup.string().required('Chapter name is required').min(2),
  description: Yup.string(),
  order: Yup.number().min(0).required('Order required'),
  visible: Yup.boolean(),
  practiceMode: Yup.boolean(),
  subject: Yup.string().required('Subject is required'),
});

const quizConfigSchema = Yup.object().shape({
  examQuestions: Yup.number().min(0, 'Exam questions must be non-negative').required('Exam questions required'),
  battleQuestions: Yup.number().min(0, 'Battle questions must be non-negative').required('Battle questions required'),
});

const TABS = ['Users', 'Subjects', 'Chapters', 'Questions', 'Quiz Config', 'Leaderboard Reset', 'WhatsApp'];

export default function AdminDashboard() {
  // Core state
  const [tab, setTab] = useState('Users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: '', data: {} });
  const navigate = useNavigate();

  // Data state
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizConfigs, setQuizConfigs] = useState([]);

  // Form state
  const [selectedChapter, setSelectedChapter] = useState('');
  const [adminVisibleForChapter, setAdminVisibleForChapter] = useState(true);
  const [newQuestion, setNewQuestion] = useState({
    question: '', options: ['', '', '', ''], correctAnswer: 0, chapter: '', duration: 60, explanation: '',
  });
  const [newSubject, setNewSubject] = useState({
    name: '', description: '', order: 0, visible: true,
  });
  const [newChapter, setNewChapter] = useState({
    name: '', description: '', order: 0, visible: true, practiceMode: false, subject: '',
  });

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editSubject, setEditSubject] = useState(null);
  const [editChapter, setEditChapter] = useState(null);

  // UI state
  const [resetMsg, setResetMsg] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [showBulkParser, setShowBulkParser] = useState(false);
  const [parsingLoading, setParsingLoading] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage, setQuestionsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('none');

  // Utility functions
  const clearAuthData = useCallback(() => {
    try {
      secureStorage.clear();
    } catch (err) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
  }, []);

  const getApiUrl = useCallback(() => import.meta.env.VITE_API_URL || '', []);

  const handleAuthError = useCallback(() => {
    clearAuthData();
    navigate('/login');
  }, [clearAuthData, navigate]);

  const getQuestionCount = useCallback((chapterName) => {
    return questions.filter(q => q.chapter === chapterName).length;
  }, [questions]);

  // API function with AbortController
  const createApiCall = useCallback((url, options = {}) => {
    const controller = new AbortController();
    const promise = axios({
      url: `${getApiUrl()}${url}`,
      headers: authHeader(),
      signal: controller.signal,
      ...options,
    });
    promise.cancel = () => controller.abort();
    return promise;
  }, [getApiUrl]);

  // Modal handler for prompts
  const openModal = (type, data) => setModal({ isOpen: true, type, data });
  const closeModal = () => setModal({ isOpen: false, type: '', data: {} });

  // Check admin access
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkAdminAccess = async () => {
      try {
        const response = await createApiCall('/api/auth/validate', { signal: controller.signal });
        if (!isMounted) return;

        if (!response.data.valid || !response.data.user?.isAdmin) {
          handleAuthError();
          return;
        }
        setLoading(false);
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') handleAuthError();
      }
    };

    checkAdminAccess();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [createApiCall, handleAuthError]);

  // Data loader with cancellation
  const createDataLoader = useCallback((endpoint, setter, tabName) => {
    return () => {
      if (tab !== tabName) return;

      let isMounted = true;
      const controller = new AbortController();

      const loadData = async () => {
        setLoading(true);
        setError('');

        try {
          const response = await createApiCall(endpoint, { signal: controller.signal });
          if (isMounted) {
            setter(response.data.users || response.data);
          }
        } catch (err) {
          if (!isMounted || err.name === 'AbortError') return;

          const errorMessage = err.response?.status === 401
            ? 'Unauthorized access'
            : err.response?.data?.error || `Failed to load ${tabName.toLowerCase()}`;
          setError(errorMessage);
          console.error(`Error loading ${tabName}:`, err);

          if (err.response?.status === 401) {
            handleAuthError();
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadData();
      return () => {
        isMounted = false;
        controller.abort();
      };
    };
  }, [tab, createApiCall, handleAuthError]);

  // Load data based on active tab
  useEffect(createDataLoader('/api/admin/users', setUsers, 'Users'), [createDataLoader]);
  useEffect(createDataLoader('/api/admin/subjects', setSubjects, 'Subjects'), [createDataLoader]);
  useEffect(createDataLoader('/api/admin/chapters', setChapters, 'Chapters'), [createDataLoader]);
  useEffect(createDataLoader('/api/admin/questions', setQuestions, 'Questions'), [createDataLoader]);
  useEffect(createDataLoader('/api/admin/quiz-configs', setQuizConfigs, 'Quiz Config'), [createDataLoader]);

  // User management with modals
  const handleEditWhatsApp = useCallback(async (userId, username, currentPhone, currentNotifications) => {
    openModal('whatsapp', { userId, username, currentPhone, currentNotifications });
  }, []);

  const handleWhatsAppSubmit = useCallback(async ({ userId, phoneNumber, enableNotifications }) => {
    setLoading(true);
    try {
      await createApiCall(`/api/admin/users/${userId}/whatsapp`, {
        method: 'PUT',
        data: { phoneNumber: phoneNumber.trim(), whatsappNotifications: enableNotifications },
      });
      const response = await createApiCall('/api/admin/users');
      setUsers(response.data.users || response.data);
      setError('');
      alert(`WhatsApp settings updated for ${userId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update WhatsApp settings');
      console.error('WhatsApp update error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  const handleDeleteUser = useCallback((userId, username, isAdmin) => {
    if (isAdmin) {
      setError('Cannot delete admin users');
      return;
    }
    openModal('deleteUser', { userId, username });
  }, []);

  const handleDeleteUserSubmit = useCallback(async ({ userId, reason }) => {
    setLoading(true);
    try {
      await createApiCall(`/api/admin/users/${userId}/request-deletion`, {
        method: 'POST',
        data: { reason: reason.trim() },
      });
      setError('');
      alert(`Deletion request for "${userId}" submitted! Awaiting SuperAdmin approval.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit deletion request');
      console.error('Delete user error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  const handleResetUserScore = useCallback((userId, username) => {
    openModal('resetScore', { userId, username });
  }, []);

  const handleResetUserScoreSubmit = useCallback(async ({ userId, reason }) => {
    setLoading(true);
    try {
      await createApiCall(`/api/admin/users/${userId}/request-score-reset`, {
        method: 'POST',
        data: { reason: reason.trim() },
      });
      setError('');
      alert(`Score reset request for "${userId}" submitted! Awaiting SuperAdmin approval.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit score reset request');
      console.error('Reset score error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  // CRUD operations with validation
  const createCRUDHandlers = useCallback((endpoint, setter, resetForm, schema) => ({
    add: async (e, data) => {
      e.preventDefault();
      try {
        await schema.validate(data, { abortEarly: false });
        setLoading(true);
        const response = await createApiCall(endpoint, { method: 'POST', data });
        setter(prev => [...prev, response.data]);
        resetForm();
        setError('');
      } catch (err) {
        const errorMessage = err.name === 'ValidationError'
          ? err.errors.join(', ')
          : err.response?.data?.error || 'Failed to add item';
        setError(errorMessage);
        console.error('Add item error:', err);
      } finally {
        setLoading(false);
      }
    },
    edit: async (e, id, data) => {
      e.preventDefault();
      try {
        await schema.validate(data, { abortEarly: false });
        setLoading(true);
        const response = await createApiCall(`${endpoint}/${id}`, { method: 'PUT', data });
        setter(prev => prev.map(item => item._id === id ? response.data : item));
        setEditingId(null);
        setError('');
      } catch (err) {
        const errorMessage = err.name === 'ValidationError'
          ? err.errors.join(', ')
          : err.response?.data?.error || 'Failed to edit item';
        setError(errorMessage);
        console.error('Edit item error:', err);
      } finally {
        setLoading(false);
      }
    },
    delete: async (id, confirmMessage) => {
      openModal('delete', { id, endpoint, setter, confirmMessage });
    },
  }), [createApiCall]);

  const handleDeleteSubmit = useCallback(async ({ id, endpoint, setter, confirmMessage }) => {
    setLoading(true);
    try {
      await createApiCall(`${endpoint}/${id}`, { method: 'DELETE' });
      setter(prev => prev.filter(item => item._id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
      console.error('Delete item error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  // Subject handlers
  const subjectHandlers = createCRUDHandlers('/api/admin/subjects', setSubjects, () =>
    setNewSubject({ name: '', description: '', order: 0, visible: true }), subjectSchema);

  const handleAddSubject = useCallback((e) => subjectHandlers.add(e, newSubject), [subjectHandlers, newSubject]);
  const handleEditSubject = useCallback((e) => subjectHandlers.edit(e, editingId, editSubject), [subjectHandlers, editingId, editSubject]);
  const handleDeleteSubject = useCallback((id) => subjectHandlers.delete(id, 'Delete this subject? All chapters and questions in this subject will also be deleted.'), [subjectHandlers]);

  // Chapter handlers
  const chapterHandlers = createCRUDHandlers('/api/admin/chapters', setChapters, () =>
    setNewChapter({ name: '', description: '', order: 0, visible: true, practiceMode: false, subject: '' }), chapterSchema);

  const handleAddChapter = useCallback((e) => chapterHandlers.add(e, newChapter), [chapterHandlers, newChapter]);
  const handleEditChapter = useCallback(async (e) => {
    e.preventDefault();
    try {
      await chapterSchema.validate(editChapter, { abortEarly: false });
      setLoading(true);
      const response = await createApiCall(`/api/admin/chapters/${editingId}`, { method: 'PUT', data: editChapter });
      setChapters(response.data);
      setEditingId(null);
      setEditChapter(null);
      setError('');
    } catch (err) {
      const errorMessage = err.name === 'ValidationError'
        ? err.errors.join(', ')
        : err.response?.data?.error || 'Failed to edit chapter';
      setError(errorMessage);
      console.error('Edit chapter error:', err);
    } finally {
      setLoading(false);
    }
  }, [createApiCall, editingId, editChapter]);

  const handleDeleteChapter = useCallback((id) => chapterHandlers.delete(id, 'Delete this chapter? All questions in this chapter will also be deleted.'), [chapterHandlers]);

  // Question handlers
  const handleAddQuestion = useCallback(async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...newQuestion,
        correctAnswer: newQuestion.options[newQuestion.correctAnswer],
        adminVisible: adminVisibleForChapter,
      };
      await questionSchema.validate(questionData, { abortEarly: false });
      setLoading(true);
      const response = await createApiCall('/api/admin/questions', { method: 'POST', data: questionData });
      setQuestions(prev => [...prev, response.data]);
      setNewQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0, chapter: selectedChapter, duration: 60, explanation: '' });
      setError('');
    } catch (err) {
      const errorMessage = err.name === 'ValidationError'
        ? err.errors.join(', ')
        : err.response?.data?.error || 'Failed to add question';
      setError(errorMessage);
      console.error('Add question error:', err);
    } finally {
      setLoading(false);
    }
  }, [createApiCall, newQuestion, adminVisibleForChapter, selectedChapter]);

  const handleEditQuestion = useCallback(async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...editQuestion,
        correctAnswer: editQuestion.options[editQuestion.correctAnswer],
      };
      await questionSchema.validate(questionData, { abortEarly: false });
      setLoading(true);
      const response = await createApiCall(`/api/admin/questions/${editingId}`, { method: 'PUT', data: questionData });
      setQuestions(prev => prev.map(q => q._id === editingId ? response.data : q));
      setEditingId(null);
      setEditQuestion(null);
      setError('');
    } catch (err) {
      const errorMessage = err.name === 'ValidationError'
        ? err.errors.join(', ')
        : err.response?.data?.error || 'Failed to edit question';
      setError(errorMessage);
      console.error('Edit question error:', err);
    } finally {
      setLoading(false);
    }
  }, [createApiCall, editingId, editQuestion]);

  const handleDeleteQuestion = useCallback((id) => {
    openModal('deleteQuestion', { id });
  }, []);

  const handleDeleteQuestionSubmit = useCallback(async ({ id }) => {
    setLoading(true);
    try {
      await createApiCall(`/api/admin/questions/${id}`, { method: 'DELETE' });
      setQuestions(prev => prev.filter(q => q._id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question');
      console.error('Delete question error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  // Bulk question handling
  const handleBulkParse = useCallback(async () => {
    if (!bulkText.trim()) {
      setError('Bulk text cannot be empty');
      return;
    }

    const sanitizedText = DOMPurify.sanitize(bulkText);
    setParsingLoading(true);
    try {
      const response = await createApiCall('/api/admin/parse-bulk-questions', {
        method: 'POST',
        data: { bulkText: sanitizedText },
      });

      // Validate parsed questions
      const validatedQuestions = response.data.questions.filter(pq => {
        try {
          const options = Array.isArray(pq.options)
            ? pq.options
            : [pq.options['ক'] || pq.options['A'] || '', pq.options['খ'] || pq.options['B'] || '', pq.options['গ'] || pq.options['C'] || '', pq.options['ঘ'] || pq.options['D'] || ''];
          const validOptions = options.filter(opt => opt && opt.trim());
          return pq.question && validOptions.length >= 2 && validOptions.includes(pq.correctAnswer);
        } catch {
          return false;
        }
      });

      if (validatedQuestions.length === 0) {
        setError('No valid questions parsed. Check the format.');
      } else {
        setParsedQuestions(validatedQuestions);
        setBulkText('');
        setShowBulkParser(false);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse questions. Check the format.');
      console.error('Bulk parse error:', err);
    } finally {
      setParsingLoading(false);
    }
  }, [bulkText, createApiCall]);

  const handleAddParsedQuestion = useCallback((parsedQ, index) => {
    const options = Array.isArray(parsedQ.options)
      ? parsedQ.options
      : [parsedQ.options['ক'] || parsedQ.options['A'] || '', parsedQ.options['খ'] || parsedQ.options['B'] || '', parsedQ.options['গ'] || parsedQ.options['C'] || '', parsedQ.options['ঘ'] || parsedQ.options['D'] || ''];

    const validOptions = options.filter(opt => opt && opt.trim());
    const correctAnswerIndex = validOptions.findIndex(opt => opt === parsedQ.correctAnswer);

    if (correctAnswerIndex < 0) {
      setError('Invalid correct answer for question');
      return;
    }

    setNewQuestion({
      question: parsedQ.question,
      options: validOptions,
      correctAnswer: correctAnswerIndex,
      chapter: selectedChapter,
      duration: 60,
      explanation: parsedQ.explanation || '',
    });

    setUsedQuestions(prev => new Set([...prev, index]));
  }, [selectedChapter]);

  const handleAddAllQuestions = useCallback(async () => {
    if (!selectedChapter) {
      setError('Please select a chapter first');
      return;
    }

    const validQuestions = parsedQuestions
      .map((pq, index) => {
        const options = Array.isArray(pq.options)
          ? pq.options
          : [pq.options['ক'] || pq.options['A'] || '', pq.options['খ'] || pq.options['B'] || '', pq.options['গ'] || pq.options['C'] || '', pq.options['ঘ'] || pq.options['D'] || ''];
        const validOptions = options.filter(opt => opt && opt.trim());
        const correctAnswerIndex = validOptions.findIndex(opt => opt === pq.correctAnswer);

        if (!pq.question?.trim() || validOptions.length < 2 || correctAnswerIndex < 0) {
          return null;
        }

        return { pq, index, validOptions, correctAnswerIndex };
      })
      .filter(q => q !== null);

    if (validQuestions.length === 0) {
      setError('No valid questions found. Please fix the questions and try again.');
      return;
    }

    openModal('addAllQuestions', { validQuestions });
  }, [selectedChapter, parsedQuestions]);

  const handleAddAllQuestionsSubmit = useCallback(async ({ validQuestions }) => {
    setLoading(true);
    try {
      const questionsToAdd = validQuestions.map(({ pq, validOptions, correctAnswerIndex }) => ({
        question: DOMPurify.sanitize(pq.question),
        options: validOptions.map(opt => DOMPurify.sanitize(opt)),
        correctAnswer: validOptions[correctAnswerIndex],
        chapter: selectedChapter,
        duration: 60,
        explanation: DOMPurify.sanitize(pq.explanation || ''),
        adminVisible: adminVisibleForChapter,
      }));

      const response = await createApiCall('/api/admin/questions/bulk', {
        method: 'POST',
        data: { questions: questionsToAdd },
      });

      setQuestions(prev => [...prev, ...response.data]);
      const validIndices = new Set(validQuestions.map(({ index }) => index));
      setParsedQuestions(prev => prev.filter((_, i) => !validIndices.has(i)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add questions in bulk');
      console.error('Bulk add error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [selectedChapter, adminVisibleForChapter, createApiCall]);

  const handleRemoveParsedQuestion = useCallback((index) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Question filtering and pagination
  const getFilteredQuestions = useCallback(() => {
    if (selectedChapterFilter === 'none') return [];

    let filtered = questions;

    if (selectedChapterFilter) {
      filtered = filtered.filter(q => q.chapter === selectedChapterFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(query) ||
        q.chapter.toLowerCase().includes(query) ||
        q.options.some(opt => opt.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [questions, selectedChapterFilter, searchQuery]);

  const getPaginatedQuestions = useCallback(() => {
    const filtered = getFilteredQuestions();
    const startIndex = (currentPage - 1) * questionsPerPage;
    return filtered.slice(startIndex, startIndex + questionsPerPage);
  }, [getFilteredQuestions, currentPage, questionsPerPage]);

  const getTotalPages = useCallback(() => {
    const filtered = getFilteredQuestions();
    return Math.ceil(filtered.length / questionsPerPage);
  }, [getFilteredQuestions, questionsPerPage]);

  const handleFilterChange = useCallback((newChapter, newSearch) => {
    setSelectedChapterFilter(newChapter);
    setSearchQuery(newSearch);
    setCurrentPage(1);
  }, []);

  // Quiz config and leaderboard
  const handleUpdateQuizConfig = useCallback(async (chapterId, examQuestions, battleQuestions) => {
    setLoading(true);
    try {
      const chapter = chapters.find(c => c._id === chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }
      const questionCount = getQuestionCount(chapter.name);
      const parsedExamQuestions = parseInt(examQuestions) || 50;
      const parsedBattleQuestions = parseInt(battleQuestions) || 0;

      if (parsedExamQuestions > questionCount) {
        throw new Error(`Not enough questions in chapter "${chapter.name}". Requested ${parsedExamQuestions} exam questions, but only ${questionCount} available.`);
      }
      if (parsedBattleQuestions > questionCount) {
        throw new Error(`Not enough questions in chapter "${chapter.name}". Requested ${parsedBattleQuestions} battle questions, but only ${questionCount} available.`);
      }

      await quizConfigSchema.validate({ examQuestions: parsedExamQuestions, battleQuestions: parsedBattleQuestions }, { abortEarly: false });

      const response = await createApiCall(`/api/admin/quiz-configs/${chapterId}`, {
        method: 'PUT',
        data: { examQuestions: parsedExamQuestions, battleQuestions: parsedBattleQuestions },
      });

      setQuizConfigs(prev =>
        prev.map(config => config.chapterId === chapterId ? response.data : config)
      );
      setError('');
    } catch (err) {
      const errorMessage = err.name === 'ValidationError'
        ? err.errors.join(', ')
        : err.message || err.response?.data?.error || 'Failed to update quiz configuration';
      setError(errorMessage);
      console.error('Update quiz config error:', err);
    } finally {
      setLoading(false);
    }
  }, [createApiCall, chapters, getQuestionCount]);

  const createLeaderboardResetHandler = useCallback((type, endpoint) => async () => {
    openModal('resetLeaderboard', { type, endpoint });
  }, []);

  const handleResetLeaderboardSubmit = useCallback(async ({ type, endpoint, reason }) => {
    setLoading(true);
    try {
      await createApiCall(endpoint, {
        method: 'POST',
        data: { reason: reason.trim() },
      });
      setResetMsg(`${type} leaderboard reset request submitted! Awaiting SuperAdmin approval.`);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || `Failed to submit ${type} reset request`);
      console.error('Leaderboard reset error:', err);
    } finally {
      setLoading(false);
      closeModal();
    }
  }, [createApiCall]);

  const handleResetQuizLeaderboard = createLeaderboardResetHandler('Quiz', '/api/admin/leaderboard/request-quiz-reset');
  const handleResetBattleLeaderboard = createLeaderboardResetHandler('Battle', '/api/admin/leaderboard/request-battle-reset');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
        <div className="max-w-7xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button
                key={t}
                className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  tab === t
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
                onClick={() => { setTab(t); setError(''); setResetMsg(''); }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Success Message Display */}
          {resetMsg && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
              {resetMsg}
            </div>
          )}

          {/* Modal for User Actions */}
          <Modal
            isOpen={modal.isOpen}
            onRequestClose={closeModal}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-auto mt-20"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            {modal.type === 'whatsapp' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Edit WhatsApp for {modal.data.username}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleWhatsAppSubmit({
                      userId: modal.data.userId,
                      phoneNumber: formData.get('phoneNumber'),
                      enableNotifications: formData.get('enableNotifications') === 'on',
                    });
                  }}
                >
                  <input
                    type="text"
                    name="phoneNumber"
                    defaultValue={modal.data.currentPhone || ''}
                    placeholder="Enter WhatsApp number"
                    className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      name="enableNotifications"
                      defaultChecked={modal.data.currentNotifications}
                      className="mr-2"
                    />
                    Enable WhatsApp Notifications
                  </label>
                  <div className="flex gap-4">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white">
                      Save
                    </button>
                    <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            {modal.type === 'deleteUser' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Delete User {modal.data.username}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteUserSubmit({
                      userId: modal.data.userId,
                      reason: e.target.reason.value,
                    });
                  }}
                >
                  <textarea
                    name="reason"
                    placeholder="Provide a reason for deletion"
                    className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded"
                    required
                  />
                  <div className="flex gap-4">
                    <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
                      Submit
                    </button>
                    <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            {modal.type === 'resetScore' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reset Score for {modal.data.username}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResetUserScoreSubmit({
                      userId: modal.data.userId,
                      reason: e.target.reason.value,
                    });
                  }}
                >
                  <textarea
                    name="reason"
                    placeholder="Provide a reason for score reset"
                    className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded"
                    required
                  />
                  <div className="flex gap-4">
                    <button type="submit" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white">
                      Submit
                    </button>
                    <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            {modal.type === 'delete' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-4">{modal.data.confirmMessage}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleDeleteSubmit(modal.data)}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                  >
                    Delete
                  </button>
                  <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {modal.type === 'deleteQuestion' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Confirm Question Deletion</h2>
                <p className="mb-4">Delete this question?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleDeleteQuestionSubmit({ id: modal.data.id })}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                  >
                    Delete
                  </button>
                  <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {modal.type === 'addAllQuestions' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Add All Questions</h2>
                <p className="mb-4">Add {modal.data.validQuestions.length} valid questions to "{selectedChapter}"?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAddAllQuestionsSubmit({ validQuestions: modal.data.validQuestions })}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
                  >
                    Add All
                  </button>
                  <button onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {modal.type === 'resetLeaderboard' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Reset {modal.data.type} Leaderboard</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResetLeaderboardSubmit({
                      type: modal.data.type,
                      endpoint: modal.data.endpoint,
                      reason: e.target.reason.value,
                    });
                  }}
                >
                  <textarea
                    name="reason"
                    placeholder={`Provide a reason for ${modal.data.type} leaderboard reset`}
                    className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded"
                    required
                  />
                  <div className="flex gap-4">
                    <button type="submit" className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded text-white">
                      Submit
                    </button>
                    <button type="button" onClick={closeModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </Modal>

          {/* Users Tab */}
          {tab === 'Users' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading users...</div>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Username</th>
                      <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Email</th>
                      <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">WhatsApp</th>
                      <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Admin</th>
                      <th className="p-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="p-4 text-gray-800 dark:text-white">{u.username}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                        <td className="p-4">
                          <div className="text-xs">
                            <div>{u.phoneNumber || 'No phone'}</div>
                            <div className={u.whatsappNotifications ? 'text-green-600' : 'text-gray-400'}>
                              {u.whatsappNotifications ? '🔔 On' : '🔕 Off'}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{u.isAdmin ? '✅' : ''}</td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEditWhatsApp(u._id, u.username, u.phoneNumber, u.whatsappNotifications)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                            >
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleResetUserScore(u._id, u.username)}
                              disabled={loading}
                              className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                            >
                              Reset Score
                            </button>
                            {!u.isAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.username, u.isAdmin)}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                              >
                                Request Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Questions Tab with Chorcha Import */}
          {tab === 'Questions' && (
            <div className="space-y-6">
              {/* Pagination Settings */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <label className="mr-2">Questions per page:</label>
                <select
                  value={questionsPerPage}
                  onChange={(e) => setQuestionsPerPage(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Chorcha Import Section */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-700">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-4">🚀 Easy Question Import from Chorcha</h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800 dark:text-white">📋 Instructions:</h4>
                      <button
                        onClick={() => {
                          const script = `javascript:(function(){const q=[];document.querySelectorAll('div.rounded-xl').forEach(c=>{try{const qDiv=c.querySelector('div.flex-grow');const qText=qDiv?qDiv.textContent.trim():'';if(!qText)return;const opts={};let correctAns='';c.querySelectorAll('button[type="button"]').forEach(btn=>{const optDiv=btn.querySelector('div.rounded-full');const optContent=btn.querySelector('div.text-left.overflow-x-auto')||btn.querySelector('p');if(optDiv&&optContent){const optLetter=optDiv.textContent.trim();const optText=optContent.textContent.trim();if(optLetter.match(/[কখগঘ]/)){opts[optLetter]=optText;if(optDiv.classList.contains('skipped'))correctAns=optText;}}});const expDiv=c.querySelector('div.p-3.rounded-lg.bg-green-200\\/25');const exp=expDiv?expDiv.textContent.trim():'';if(qText&&Object.keys(opts).length>=2)q.push({question:qText,options:opts,correctAnswer:correctAns,explanation:exp});}catch(e){console.log('Error:',e);}});const fmt=q.map(q=>{const optsText=Object.entries(q.options).map(([k,v])=>k+'. '+v).join('\\n');return q.question+'\\n'+optsText+'\\nCorrect Answer: '+q.correctAnswer+'\\nExplanation: '+q.explanation;}).join('\\n\\n---\\n\\n');const popup=window.open('','_blank','width=800,height=600,scrollbars=yes');popup.document.write('<html><head><title>Questions ('+q.length+')</title></head><body style="font-family:Arial;padding:20px;"><h2>'+q.length+' Questions</h2><button onclick="navigator.clipboard.writeText(document.getElementById(\\'q\\').textContent);alert(\\'Copied!\\');" style="background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin-bottom:20px;">Copy All</button><pre id="q" style="background:#f5f5f5;padding:15px;border-radius:5px;white-space:pre-wrap;">'+fmt+'</pre></body></html>');})();`;
                          navigator.clipboard.writeText(script).then(() => {
                            alert('Script copied! Paste in browser console on Chorcha review page.');
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                      >
                        📋 Copy Script
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>Go to Chorcha → Start any test → Submit without solving</li>
                      <li>Open Developer Tools (F12) → Console tab</li>
                      <li>Paste the script → Press Enter</li>
                      <li>Copy questions from popup → Paste below</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Bulk Parser */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Bulk Question Parser</h3>
                  <button
                    onClick={() => setShowBulkParser(!showBulkParser)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white transition-colors"
                  >
                    {showBulkParser ? 'Hide Parser' : 'Show Parser'}
                  </button>
                </div>
                {showBulkParser && (
                  <div className="space-y-4">
                    <textarea
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                      rows="10"
                      placeholder="Paste extracted questions here..."
                    />
                    <button
                      onClick={handleBulkParse}
                      disabled={!bulkText.trim() || parsingLoading}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
                    >
                      {parsingLoading ? 'Parsing...' : 'Parse Questions'}
                    </button>
                  </div>
                )}
              </div>

              {/* AI LaTeX Generator */}
              <AILatexGenerator
                onInsert={(latex) => setNewQuestion(prev => ({ ...prev, question: prev.question + latex }))}
                onInsertOption={(latex, fieldName) => {
                  const optionIndex = parseInt(fieldName.replace('option', ''));
                  setNewQuestion(prev => {
                    const newOptions = [...prev.options];
                    newOptions[optionIndex] = newOptions[optionIndex] + latex;
                    return { ...prev, options: newOptions };
                  });
                }}
                focusedField={focusedField}
              />

              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                [Questions management interface continues...]
              </div>
            </div>
          )}

          {tab !== 'Users' && tab !== 'Questions' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {tab} tab implementation continues...
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
