import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MathText from '../components/MathText';
import AILatexGenerator from '../components/AILatexGenerator';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import { secureStorage } from '../utils/secureStorage.js';
import { useCRUD } from '../hooks/useCRUD';
import { sanitizeInput, sanitizeObject } from '../utils/sanitizer';

const TABS = ['Users', 'Subjects', 'Chapters', 'Questions', 'Quiz Config', 'Leaderboard Reset', 'WhatsApp'];



export default function AdminDashboard() {
  const [tab, setTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizConfigs, setQuizConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // CRUD hooks for different entities
  const usersCRUD = useCRUD('users', {
    onSuccess: (operation, result) => {
      if (operation === 'read') setUsers(result);
      setError('');
    },
    onError: (operation, errorMsg) => setError(errorMsg)
  });
  
  const subjectsCRUD = useCRUD('subjects', {
    onSuccess: (operation, result) => {
      if (operation === 'read') setSubjects(result);
      else if (operation === 'create') setSubjects(prev => [...prev, result]);
      else if (operation === 'update') setSubjects(prev => prev.map(s => s._id === result._id ? result : s));
      else if (operation === 'delete') setSubjects(prev => prev.filter(s => s._id !== result));
      setError('');
    },
    onError: (operation, errorMsg) => setError(errorMsg)
  });
  
  const chaptersCRUD = useCRUD('chapters', {
    onSuccess: (operation, result) => {
      if (operation === 'read') setChapters(result);
      else if (operation === 'create') setChapters(prev => [...prev, result]);
      else if (operation === 'update') setChapters(result); // Reload all chapters
      else if (operation === 'delete') setChapters(prev => prev.filter(c => c._id !== result));
      setError('');
    },
    onError: (operation, errorMsg) => setError(errorMsg)
  });
  
  const questionsCRUD = useCRUD('questions', {
    onSuccess: (operation, result) => {
      if (operation === 'read') setQuestions(result);
      else if (operation === 'create') setQuestions(prev => [...prev, result]);
      else if (operation === 'update') setQuestions(prev => prev.map(q => q._id === result._id ? result : q));
      else if (operation === 'delete') setQuestions(prev => prev.filter(q => q._id !== result));
      setError('');
    },
    onError: (operation, errorMsg) => setError(errorMsg)
  });

  // Check admin access on mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/auth/validate`, { 
          headers: authHeader() 
        });
        
        if (!response.data.valid) {
          // Clear auth data for deleted/invalid users
          secureStorage.clear();
          navigate('/login');
          return;
        }
        
        if (!response.data.user?.isAdmin) {
          navigate('/login');
          return;
        }
        
        setLoading(false);
      } catch (err) {
        // Clear auth data on any error
        secureStorage.clear();
        navigate('/login');
      }
    };

    checkAdminAccess();
  }, [navigate]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [adminVisibleForChapter, setAdminVisibleForChapter] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, chapter: '', duration: 60, explanation: '' });
  const [newSubject, setNewSubject] = useState({ name: '', description: '', order: 0, visible: true });
  const [newChapter, setNewChapter] = useState({ name: '', description: '', order: 0, visible: true, practiceMode: false, subject: '' });
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editSubject, setEditSubject] = useState(null);
  const [editChapter, setEditChapter] = useState(null);
  const [resetMsg, setResetMsg] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [showBulkParser, setShowBulkParser] = useState(false);
  const [parsingLoading, setParsingLoading] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('none');

  // Get question count for a chapter
  const getQuestionCount = (chapterName) => {
    return questions.filter(q => q.chapter === chapterName).length;
  };

  // Load users
  useEffect(() => {
    if (tab !== 'Users') return;
    usersCRUD.read().catch(() => {});
  }, [tab, usersCRUD]);

  // Load subjects
  useEffect(() => {
    if (tab !== 'Subjects') return;
    subjectsCRUD.read().catch(() => {});
  }, [tab, subjectsCRUD]);

  // Load chapters
  useEffect(() => {
    if (tab !== 'Chapters') return;
    chaptersCRUD.read().catch(() => {});
  }, [tab, chaptersCRUD]);

  // Load questions
  useEffect(() => {
    if (tab !== 'Questions') return;
    questionsCRUD.read().catch(() => {});
  }, [tab, questionsCRUD]);

  // Load subjects
  useEffect(() => {
    if (tab !== 'Subjects') return;
    
    const loadSubjects = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/subjects`, { 
          headers: authHeader() 
        });
        setSubjects(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load subjects';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [tab]);

  // Load chapters
  useEffect(() => {
    if (tab !== 'Chapters') return;
    
    const loadChapters = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/chapters`, { 
          headers: authHeader() 
        });
        setChapters(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load chapters';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadChapters();
  }, [tab]);

  // Load questions
  useEffect(() => {
    if (tab !== 'Questions') return;
    
    const loadQuestions = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/questions`, { 
          headers: authHeader() 
        });
        setQuestions(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load questions';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [tab]);

  // Load quiz configs
  useEffect(() => {
    if (tab !== 'Quiz Config') return;
    
    const loadQuizConfigs = async () => {
      setLoading(true);
      setError('');
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/admin/quiz-configs`, { 
          headers: authHeader() 
        });
        setQuizConfigs(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load quiz configs';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadQuizConfigs();
  }, [tab]);

  // Edit user WhatsApp settings
  function handleEditWhatsApp(userId, username, currentPhone, currentNotifications) {
    const phoneNumber = prompt(`Enter WhatsApp number for ${username}:`, currentPhone || '');
    if (phoneNumber === null) return;
    
    const enableNotifications = window.confirm(`Enable WhatsApp notifications for ${username}?`);
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.put(`${apiUrl}/api/admin/users/${userId}/whatsapp`, {
      phoneNumber: phoneNumber.trim(),
      whatsappNotifications: enableNotifications
    }, { headers: authHeader() })
      .then(() => {
        setError('');
        // Reload users to show updated data
        const loadUsers = async () => {
          try {
            const response = await axios.get(`${apiUrl}/api/admin/users`, { headers: authHeader() });
            setUsers(response.data.users || response.data);
          } catch (err) {
            console.error('Failed to reload users:', err);
          }
        };
        loadUsers();
        alert(`WhatsApp settings updated for ${username}`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Failed to update WhatsApp settings';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }

  // Request user deletion
  function handleDeleteUser(userId, username, isAdmin) {
    if (isAdmin) {
      setError('Cannot delete admin users');
      return;
    }
    
    const reason = prompt(`Please provide a reason for deleting user "${username}":`);
    if (!reason || !reason.trim()) return;
    
    if (!window.confirm(`Submit deletion request for user "${username}"? This will require SuperAdmin approval.`)) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/users/${userId}/request-deletion`, {
      reason: reason.trim()
    }, { headers: authHeader() })
      .then(() => {
        setError('');
        alert(`Deletion request for "${username}" submitted! Awaiting SuperAdmin approval.`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Failed to submit deletion request';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }

  // Request user score reset (reset scores, stats, badges - keep account)
  function handleResetUserScore(userId, username) {
    const reason = prompt(`Please provide a reason for resetting "${username}"'s scores and stats:`);
    if (!reason || !reason.trim()) return;
    
    if (!window.confirm(`Submit score reset request for user "${username}"? This will reset all their scores, stats, badges, and leaderboard data. SuperAdmin approval required.`)) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/users/${userId}/request-score-reset`, {
      reason: reason.trim()
    }, { headers: authHeader() })
      .then(() => {
        setError('');
        alert(`Score reset request for "${username}" submitted! Awaiting SuperAdmin approval.`);
      })
      .catch(err => {
        const errorMsg = err.response?.data?.error || 'Failed to submit score reset request';
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }

  // Add new subject
  async function handleAddSubject(e) {
    e.preventDefault();
    try {
      await subjectsCRUD.create(sanitizeObject(newSubject));
      setNewSubject({ name: '', description: '', order: 0, visible: true });
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Add new chapter
  async function handleAddChapter(e) {
    e.preventDefault();
    try {
      await chaptersCRUD.create(sanitizeObject(newChapter));
      setNewChapter({ name: '', description: '', order: 0, visible: true, practiceMode: false, subject: '' });
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Edit subject
  async function handleEditSubject(e) {
    e.preventDefault();
    try {
      await subjectsCRUD.update(editingId, sanitizeObject(editSubject));
      setEditingId(null);
      setEditSubject(null);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Edit chapter
  async function handleEditChapter(e) {
    e.preventDefault();
    try {
      await chaptersCRUD.update(editingId, sanitizeObject(editChapter));
      // Reload all chapters to get fresh data
      await chaptersCRUD.read();
      setEditingId(null);
      setEditChapter(null);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Delete subject
  async function handleDeleteSubject(id) {
    if (!window.confirm('Delete this subject? All chapters and questions in this subject will also be deleted.')) return;
    try {
      await subjectsCRUD.remove(id);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Delete chapter
  async function handleDeleteChapter(id) {
    if (!window.confirm('Delete this chapter? All questions in this chapter will also be deleted.')) return;
    try {
      await chaptersCRUD.remove(id);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Add new question
  async function handleAddQuestion(e) {
    e.preventDefault();
    try {
      const questionData = {
        ...newQuestion,
        correctAnswer: newQuestion.options[newQuestion.correctAnswer],
        adminVisible: adminVisibleForChapter
      };
      await questionsCRUD.create(sanitizeObject(questionData));
      setNewQuestion({ question: '', options: ['', '', '', ''], correctAnswer: 0, chapter: selectedChapter, duration: 60, explanation: '' });
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Edit question
  async function handleEditQuestion(e) {
    e.preventDefault();
    try {
      const questionData = {
        ...editQuestion,
        correctAnswer: editQuestion.options[editQuestion.correctAnswer]
      };
      await questionsCRUD.update(editingId, sanitizeObject(questionData));
      setEditingId(null);
      setEditQuestion(null);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Delete question
  async function handleDeleteQuestion(id) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await questionsCRUD.remove(id);
    } catch (err) {
      // Error handled by CRUD hook
    }
  }

  // Handle bulk question parsing
  async function handleBulkParse() {
    if (!bulkText.trim()) return;
    
    setParsingLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiUrl}/api/admin/parse-bulk-questions`, {
        bulkText: sanitizeInput(bulkText)
      }, { headers: authHeader() });
      
      // Sanitize parsed questions
      const sanitizedQuestions = response.data.questions.map(q => sanitizeObject(q));
      setParsedQuestions(sanitizedQuestions);
      setBulkText('');
      setShowBulkParser(false);
    } catch (err) {
      console.error('Parsing error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to parse questions. Please check the format.');
    } finally {
      setParsingLoading(false);
    }
  }

  // Add parsed question to form
  function handleAddParsedQuestion(parsedQ, index) {
    // Handle both object and array format for options
    let options;
    if (Array.isArray(parsedQ.options)) {
      options = parsedQ.options;
    } else {
      options = [
        parsedQ.options['ক'] || parsedQ.options['A'] || '',
        parsedQ.options['খ'] || parsedQ.options['B'] || '',
        parsedQ.options['গ'] || parsedQ.options['C'] || '',
        parsedQ.options['ঘ'] || parsedQ.options['D'] || ''
      ];
    }
    
    // Find correct answer index
    const correctAnswerIndex = options.findIndex(opt => opt === parsedQ.correctAnswer);
    
    setNewQuestion({
      question: parsedQ.question,
      options: options,
      correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      chapter: selectedChapter,
      duration: 60,
      explanation: parsedQ.explanation || ''
    });
    
    setUsedQuestions(prev => new Set([...prev, index]));
  }

  // Add all parsed questions
  async function handleAddAllQuestions() {
    if (!selectedChapter) {
      setError('Please select a chapter first');
      return;
    }
    
    const validQuestions = [];
    const invalidQuestions = [];
    
    parsedQuestions.forEach((pq, index) => {
      const options = Array.isArray(pq.options) ? pq.options : [
        pq.options['ক'] || pq.options['A'] || '',
        pq.options['খ'] || pq.options['B'] || '',
        pq.options['গ'] || pq.options['C'] || '',
        pq.options['ঘ'] || pq.options['D'] || ''
      ];
      
      const validOptions = options.filter(opt => opt && opt.trim());
      const hasValidCorrectAnswer = pq.correctAnswer && validOptions.includes(pq.correctAnswer);
      
      if (pq.question && pq.question.trim() && validOptions.length >= 2 && hasValidCorrectAnswer) {
        validQuestions.push({ pq, index });
      } else {
        invalidQuestions.push(index);
      }
    });
    
    if (validQuestions.length === 0) {
      setError('No valid questions found. Please fix the questions and try again.');
      return;
    }
    
    if (!window.confirm(`Add ${validQuestions.length} valid questions to "${selectedChapter}"? ${invalidQuestions.length} invalid questions will remain for manual fixing.`)) return;
    
    try {
      const questionsToAdd = validQuestions.map(({ pq }) => {
        const options = Array.isArray(pq.options) ? pq.options : [
          pq.options['ক'] || pq.options['A'] || '',
          pq.options['খ'] || pq.options['B'] || '',
          pq.options['গ'] || pq.options['C'] || '',
          pq.options['ঘ'] || pq.options['D'] || ''
        ];
        
        const validOptions = options.filter(opt => opt && opt.trim());
        const correctAnswerIndex = validOptions.findIndex(opt => opt === pq.correctAnswer);
        
        return sanitizeObject({
          question: pq.question,
          options: validOptions,
          correctAnswer: validOptions[correctAnswerIndex],
          chapter: selectedChapter,
          duration: 60,
          explanation: pq.explanation || '',
          adminVisible: adminVisibleForChapter
        });
      });
      
      await questionsCRUD.bulkCreate(questionsToAdd);
      
      // Remove only valid questions, keep invalid ones
      const validIndices = new Set(validQuestions.map(({ index }) => index));
      setParsedQuestions(prev => prev.filter((_, i) => !validIndices.has(i)));
      
      setError('');
    } catch (err) {
      setError('Failed to add questions in bulk');
    }
  }

  // Remove parsed question
  function handleRemoveParsedQuestion(index) {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  }

  // Get filtered questions
  const getFilteredQuestions = () => {
    // If no filter is selected (default 'none'), return empty array
    if (selectedChapterFilter === 'none') {
      return [];
    }
    
    let filtered = questions;
    
    // Filter by selected chapter
    if (selectedChapterFilter) {
      filtered = filtered.filter(q => q.chapter === selectedChapterFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(query) ||
        q.chapter.toLowerCase().includes(query) ||
        q.options.some(opt => opt.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  // Get paginated questions
  const getPaginatedQuestions = () => {
    const filtered = getFilteredQuestions();
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Get total pages
  const getTotalPages = () => {
    const filtered = getFilteredQuestions();
    return Math.ceil(filtered.length / questionsPerPage);
  };

  // Reset pagination when filters change
  const handleFilterChange = (newChapter, newSearch) => {
    setSelectedChapterFilter(newChapter);
    setSearchQuery(newSearch);
    setCurrentPage(1);
  };

  // Update quiz config with validation
  function handleUpdateQuizConfig(chapterId, examQuestions, battleQuestions) {
    // Find the chapter to get its name and question count
    const chapter = chapters.find(ch => ch._id === chapterId);
    if (!chapter) {
      setError('Chapter not found');
      return;
    }
    
    const availableQuestions = getQuestionCount(chapter.name);
    const examQuestionsNum = parseInt(examQuestions) || 50;
    const battleQuestionsNum = parseInt(battleQuestions) || 0;
    
    // Validate question counts
    if (examQuestionsNum > availableQuestions) {
      setError(`Not enough questions in chapter '${chapter.name}'. Requested ${examQuestionsNum} exam questions, but only ${availableQuestions} available.`);
      return;
    }
    
    if (battleQuestionsNum > availableQuestions) {
      setError(`Not enough questions in chapter '${chapter.name}'. Requested ${battleQuestionsNum} battle questions, but only ${availableQuestions} available.`);
      return;
    }
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.put(`${apiUrl}/api/admin/quiz-configs/${chapterId}`, {
      examQuestions: examQuestionsNum,
      battleQuestions: battleQuestionsNum
    }, { headers: authHeader() })
      .then(res => {
        setQuizConfigs(configs => 
          configs.map(config => 
            config.chapterId === chapterId ? res.data : config
          )
        );
        setError(''); // Clear any previous errors
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to update quiz config'))
      .finally(() => setLoading(false));
  }

  // Request quiz leaderboard reset (SuperAdmin approval required)
  function handleResetQuizLeaderboard() {
    const reason = prompt('Please provide a reason for quiz leaderboard reset:');
    if (!reason || !reason.trim()) return;
    
    if (!window.confirm('Submit QUIZ leaderboard reset request? This will reset quiz scores, stats, and quiz-related data. SuperAdmin approval is required.')) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/leaderboard/request-quiz-reset`, {
      reason: reason.trim()
    }, { headers: authHeader() })
      .then(() => setResetMsg('Quiz leaderboard reset request submitted! Awaiting SuperAdmin approval.'))
      .catch(err => setError(err.response?.data?.error || 'Failed to submit quiz reset request'))
      .finally(() => setLoading(false));
  }

  // Request battle leaderboard reset (SuperAdmin approval required)
  function handleResetBattleLeaderboard() {
    const reason = prompt('Please provide a reason for battle leaderboard reset:');
    if (!reason || !reason.trim()) return;
    
    if (!window.confirm('Submit BATTLE leaderboard reset request? This will reset battle scores and battle-related data. SuperAdmin approval is required.')) return;
    
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || '';
    axios.post(`${apiUrl}/api/admin/leaderboard/request-battle-reset`, {
      reason: reason.trim()
    }, { headers: authHeader() })
      .then(() => setResetMsg('Battle leaderboard reset request submitted! Awaiting SuperAdmin approval.'))
      .catch(err => setError(err.response?.data?.error || 'Failed to submit battle reset request'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>
        
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
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

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
                            title="Edit WhatsApp settings"
                          >
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleResetUserScore(u._id, u.username)}
                            disabled={loading}
                            className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                            title="Reset user's scores, stats, and badges (requires SuperAdmin approval)"
                          >
                            Reset Score
                          </button>
                          {!u.isAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.username, u.isAdmin)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors disabled:opacity-50"
                              title="Request user deletion (requires SuperAdmin approval)"
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
        
        {tab === 'Subjects' && (
          <div className="space-y-6">
            {/* Add Subject Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Subject Name</label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={newSubject.description}
                    onChange={e => setNewSubject({...newSubject, description: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Order</label>
                  <input
                    type="number"
                    value={newSubject.order}
                    onChange={e => setNewSubject({...newSubject, order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={newSubject.visible !== false}
                      onChange={e => setNewSubject({...newSubject, visible: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Visible to users</span>
                  </label>
                </div>
                <button type="submit" disabled={subjectsCRUD.loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors">
                  {subjectsCRUD.loading ? 'Adding...' : 'Add Subject'}
                </button>
              </form>
            </div>

            {/* Subjects List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Manage Subjects</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading subjects...</div>
              ) : (
                <div className="space-y-4">
                  {subjects.map(subject => (
                    <div key={subject._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      {editingId === subject._id ? (
                        <form onSubmit={handleEditSubject} className="space-y-3">
                          <input
                            type="text"
                            value={editSubject.name}
                            onChange={e => setEditSubject({...editSubject, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            required
                          />
                          <textarea
                            value={editSubject.description}
                            onChange={e => setEditSubject({...editSubject, description: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            rows="2"
                          />
                          <input
                            type="number"
                            value={editSubject.order}
                            onChange={e => setEditSubject({...editSubject, order: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                          />
                          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={editSubject.visible !== false}
                              onChange={e => setEditSubject({...editSubject, visible: e.target.checked})}
                              className="rounded border-gray-300 dark:border-gray-500 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>Visible to users</span>
                          </label>
                          <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 text-white transition-colors">
                              Save
                            </button>
                            <button type="button" onClick={() => { setEditingId(null); setEditSubject(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{subject.name}</h4>
                              {subject.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{subject.description}</p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Order: {subject.order}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Status: <span className={subject.visible !== false ? 'text-green-600' : 'text-red-600'}>
                                  {subject.visible !== false ? 'Visible' : 'Hidden'}
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingId(subject._id); setEditSubject({...subject}); }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject._id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {tab === 'Chapters' && (
          <div className="space-y-6">
            {/* Add Chapter Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Chapter</h3>
              <form onSubmit={handleAddChapter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Subject</label>
                  <select
                    value={newChapter.subject}
                    onChange={e => setNewChapter({...newChapter, subject: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chapter Name</label>
                  <input
                    type="text"
                    value={newChapter.name}
                    onChange={e => setNewChapter({...newChapter, name: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={newChapter.description}
                    onChange={e => setNewChapter({...newChapter, description: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Order</label>
                  <input
                    type="number"
                    value={newChapter.order}
                    onChange={e => setNewChapter({...newChapter, order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={newChapter.visible !== false}
                      onChange={e => setNewChapter({...newChapter, visible: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Visible to users</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={newChapter.practiceMode === true}
                      onChange={e => setNewChapter({...newChapter, practiceMode: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Practice Mode (stats won't be calculated)</span>
                  </label>
                </div>
                <button type="submit" disabled={chaptersCRUD.loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors">
                  {chaptersCRUD.loading ? 'Adding...' : 'Add Chapter'}
                </button>
              </form>
            </div>

            {/* Chapters List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Manage Chapters</h3>
                <select
                  value={selectedChapterFilter}
                  onChange={e => setSelectedChapterFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                >
                  <option value="">All Creators</option>
                  <option value="mine">My Chapters</option>
                  {[...new Set(chapters.map(ch => ch.createdBy?.username).filter(Boolean))].map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading chapters...</div>
              ) : (
                <div className="space-y-4">
                  {chapters.filter(chapter => {
                    if (!selectedChapterFilter) return true;
                    if (selectedChapterFilter === 'mine') {
                      // Skip 'mine' filter since it requires async call
                      return true;
                    }
                    return chapter.createdBy?.username === selectedChapterFilter;
                  }).map(chapter => (
                    <div key={chapter._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      {editingId === chapter._id ? (
                        <form onSubmit={handleEditChapter} className="space-y-3">
                          <select
                            value={editChapter.subject}
                            onChange={e => setEditChapter({...editChapter, subject: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            required
                          >
                            <option value="">Select Subject</option>
                            {subjects.map(sub => (
                              <option key={sub._id} value={sub.name}>{sub.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editChapter.name}
                            onChange={e => setEditChapter({...editChapter, name: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            required
                          />
                          <textarea
                            value={editChapter.description}
                            onChange={e => setEditChapter({...editChapter, description: e.target.value})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            rows="2"
                          />
                          <input
                            type="number"
                            value={editChapter.order}
                            onChange={e => setEditChapter({...editChapter, order: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                          />
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={editChapter.visible !== false}
                                onChange={e => setEditChapter({...editChapter, visible: e.target.checked})}
                                className="rounded border-gray-300 dark:border-gray-500 text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>Visible to users</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={editChapter.practiceMode === true}
                                onChange={e => setEditChapter({...editChapter, practiceMode: e.target.checked})}
                                className="rounded border-gray-300 dark:border-gray-500 text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>Practice Mode (stats won't be calculated)</span>
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 text-white transition-colors">
                              Save
                            </button>
                            <button type="button" onClick={() => { setEditingId(null); setEditChapter(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white transition-colors">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{chapter.name}</h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm">Subject: {chapter.subject}</p>
                              {chapter.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{chapter.description}</p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Order: {chapter.order}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Created by: <span className="text-blue-600 dark:text-blue-400">
                                  {chapter.createdBy?.username || 'System'}
                                </span>
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Status: <span className={chapter.visible !== false ? 'text-green-600' : 'text-red-600'}>
                                  {chapter.visible !== false ? 'Visible' : 'Hidden'}
                                </span>
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                Mode: <span className={chapter.practiceMode ? 'text-orange-600' : 'text-blue-600'}>
                                  {chapter.practiceMode ? 'Practice Mode' : 'Normal Mode'}
                                </span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingId(chapter._id); setEditChapter({...chapter}); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Questions' && (
          <div className="space-y-6">
            {/* Easy Question Import */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-700 mb-6">
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-4">🚀 Easy Question Import from Chorcha</h3>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-white">📋 Step-by-Step Instructions:</h4>
                    <button
                      onClick={() => {
                        const script = `javascript:(function(){\n    function extractChorchaQuestions() {\n        const questions = [];\n        console.log('Starting extraction...');\n        \n        let questionContainers = document.querySelectorAll('div.space-y-4 > div.rounded-xl');\n        if (questionContainers.length === 0) {\n            questionContainers = document.querySelectorAll('div.rounded-xl');\n        }\n        \n        questionContainers.forEach((container, index) => {\n            try {\n                if (index % 10 === 0) console.log(\`Processing question \${index + 1}...\`);\n                \n                let questionArea = container.querySelector('div.space-y-2.md\\\\:space-y-3') || \n                                 container.querySelector('div.space-y-2');\n                if (!questionArea) return;\n                \n                const questionDiv = questionArea.querySelector('div.flex-grow');\n                if (!questionDiv) return;\n                \n                let questionText = questionDiv.textContent.trim();\n                if (!questionText) return;\n                \n                let optionButtons = container.querySelectorAll('div.grid.md\\\\:grid-cols-2.gap-1 button') ||\n                                  container.querySelectorAll('button[type="button"]');\n                \n                const options = {};\n                let correctAnswer = '';\n                \n                optionButtons.forEach(button => {\n                    const optionDiv = button.querySelector('div.rounded-full');\n                    let optionContent = button.querySelector('div.text-left.overflow-x-auto') ||\n                                      button.querySelector('p');\n                    \n                    if (optionDiv && optionContent) {\n                        const optionLetter = optionDiv.textContent.trim();\n                        const optionText = optionContent.textContent.trim();\n                        \n                        if (optionLetter.match(/[কখগঘ]/)) {\n                            options[optionLetter] = optionText;\n                            if (optionDiv.classList.contains('skipped')) {\n                                correctAnswer = optionText;\n                            }\n                        }\n                    }\n                });\n                \n                const explanationDiv = container.querySelector('div.p-3.rounded-lg.bg-green-200\\\\/25');\n                const explanation = explanationDiv ? explanationDiv.textContent.trim() : '';\n                \n                if (questionText && Object.keys(options).length >= 2) {\n                    questions.push({\n                        question: questionText,\n                        options: options,\n                        correctAnswer: correctAnswer,\n                        explanation: explanation\n                    });\n                }\n            } catch (error) {\n                console.log(\`Error processing question \${index + 1}:\`, error);\n            }\n        });\n        \n        return questions;\n    }\n    \n    const questions = extractChorchaQuestions();\n    const formattedText = questions.map(q => {\n        const optionsText = Object.entries(q.options)\n            .map(([letter, text]) => \`\${letter}. \${text}\`)\n            .join('\\n');\n        return \`\${q.question}\\n\${optionsText}\\nCorrect Answer: \${q.correctAnswer}\\nExplanation: \${q.explanation}\`;\n    }).join('\\n\\n---\\n\\n');\n    \n    // Create a popup with the results\n    const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');\n    popup.document.write(\`\n        <html>\n        <head><title>Extracted Questions (\${questions.length})</title></head>\n        <body style="font-family: Arial; padding: 20px;">\n            <h2>Extracted \${questions.length} Questions</h2>\n            <button onclick="navigator.clipboard.writeText(document.getElementById('questions').textContent); alert('Copied!');" \n                    style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">\n                Copy All Questions\n            </button>\n            <pre id="questions" style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">\${formattedText}</pre>\n        </body>\n        </html>\n    \`);\n})();`;
                        navigator.clipboard.writeText(script).then(() => {
                          alert('Chorcha extractor script copied to clipboard! Paste it in browser console.');
                        }).catch(() => {
                          alert('Failed to copy. Please copy manually from the file.');
                        });
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                    >
                      📋 Copy Script
                    </button>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Go to <strong>Chorcha app</strong> and start any MCQ test</li>
                    <li><strong>Submit without solving</strong> (just click submit)</li>
                    <li>You'll see the <strong>review page</strong> with all questions, correct answers, and explanations</li>
                    <li><strong>Open Developer Tools</strong> </li>
                    <li><strong>Go to Console tab</strong> and paste the extraction script (use Copy Script button above)</li>
                    <li><strong>Copy the formatted questions</strong> That will be shown in another window</li>
                    <li><strong>Paste below</strong> and click "Parse Questions(500+ power at a time!!)"</li>
                  </ol>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-700">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>💡 Pro Tip:</strong> The script automatically extracts correct answers from the colored options!
                  </p>
                </div>
              </div>
            </div>

            {/* Bulk Question Parser */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
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
                    placeholder="Paste the extracted questions from Chorcha here. Format should be:\n\n1. Question text\nক. Option 1\nখ. Option 2\nগ. Option 3\nঘ. Option 4\nCorrect Answer: Option text\nExplanation: Explanation text\n\n---\n\n2. Next question..."
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
              onInsert={(latex) => setNewQuestion(prev => ({
                ...prev, 
                question: prev.question + latex
              }))}
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

            {/* Parsed Questions Preview */}
            {parsedQuestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Parsed Questions ({parsedQuestions.length})</h3>
                  <button
                    onClick={handleAddAllQuestions}
                    disabled={!selectedChapter || loading}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add All Questions'}
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedQuestions.map((pq, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-800 dark:text-white">{pq.question}</h4>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddParsedQuestion(pq, index)}
                            className={`px-2 py-1 rounded text-xs text-white ${
                              usedQuestions.has(index)
                                ? 'bg-green-700 cursor-default'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                            disabled={usedQuestions.has(index)}
                          >
                            {usedQuestions.has(index) ? 'Used' : 'Use'}
                          </button>
                          <button
                            onClick={() => handleRemoveParsedQuestion(index)}
                            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs text-white"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {Object.entries(pq.options).map(([key, value]) => (
                          <div key={key}>{key}. {value}</div>
                        ))}
                        {pq.explanation && <div className="text-blue-600 dark:text-blue-400 mt-2">💡 {pq.explanation}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Question Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chapter (Global Selection)</label>
                  <select
                    value={selectedChapter}
                    onChange={e => {
                      setSelectedChapter(e.target.value);
                      setNewQuestion({...newQuestion, chapter: e.target.value});
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map(ch => (
                      <option key={ch._id} value={ch.name}>{ch.name}{ch.description ? ` - ${ch.description}` : ''}</option>
                    ))}
                  </select>
                  {selectedChapter && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      All questions will be added to: {selectedChapter}
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={adminVisibleForChapter}
                      onChange={e => setAdminVisibleForChapter(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>Questions visible to other admins</span>
                  </label>
                  {selectedChapter && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      All questions in "{selectedChapter}" will be {adminVisibleForChapter ? 'visible to' : 'hidden from'} other admins
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Question</label>
                  <textarea
                    value={newQuestion.question}
                    onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                    onFocus={() => setFocusedField('question')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="3"
                    placeholder="Enter question text. Use LaTeX: $x^2$ for inline math, $$\frac{a}{b}$$ for display math"
                    required
                  />
                  {newQuestion.question && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-600 rounded border">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                      <div className="text-gray-800 dark:text-white">
                        <MathText>{newQuestion.question}</MathText>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Options</label>
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} className="mb-3">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...newQuestion.options];
                          newOpts[i] = e.target.value;
                          setNewQuestion({...newQuestion, options: newOpts});
                        }}
                        onFocus={() => setFocusedField(`option${i}`)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                        placeholder={`Option ${i + 1} (LaTeX supported: $x^2$, $$\frac{a}{b}$$)`}
                        required
                      />
                      {opt && (
                        <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Preview: </span>
                          <MathText>{opt}</MathText>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Correct Answer</label>
                  <select
                    value={newQuestion.correctAnswer}
                    onChange={e => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    required
                  >
                    <option value={0}>A - {newQuestion.options[0] || 'Option 1'}</option>
                    <option value={1}>B - {newQuestion.options[1] || 'Option 2'}</option>
                    <option value={2}>C - {newQuestion.options[2] || 'Option 3'}</option>
                    <option value={3}>D - {newQuestion.options[3] || 'Option 4'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Duration (seconds)</label>
                  <input
                    type="number"
                    value={newQuestion.duration}
                    onChange={e => setNewQuestion({...newQuestion, duration: parseInt(e.target.value) || 60})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    min="30"
                    max="600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Explanation (Optional)</label>
                  <textarea
                    value={newQuestion.explanation}
                    onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    rows="3"
                    placeholder="Explain why this is the correct answer (LaTeX supported: $x^2$, $$\frac{a}{b}$$)"
                  />
                  {newQuestion.explanation && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-600 rounded border">
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                      <div className="text-gray-800 dark:text-white">
                        <MathText>{newQuestion.explanation}</MathText>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={questionsCRUD.loading} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors">
                  {questionsCRUD.loading ? 'Adding...' : 'Add Question'}
                </button>
              </form>
            </div>

            {/* Questions List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Manage Questions ({getFilteredQuestions().length} total)
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {getTotalPages()}
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Search Questions</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleFilterChange(selectedChapterFilter, e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                    placeholder="Search by question text, chapter, or options..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Filter by Chapter</label>
                  <select
                    value={selectedChapterFilter}
                    onChange={e => handleFilterChange(e.target.value, searchQuery)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                  >
                    <option value="none">Select a chapter to view questions</option>
                    <option value="">All Chapters</option>
                    {chapters.map(ch => (
                      <option key={ch._id} value={ch.name}>
                        {ch.name} ({getQuestionCount(ch.name)} questions)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading questions...</div>
              ) : getFilteredQuestions().length === 0 ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  {selectedChapterFilter === 'none' ? 'Please select a chapter to view questions.' : 
                   searchQuery || selectedChapterFilter ? 'No questions match your filters.' : 'No questions found.'}
                </div>
              ) : (
                <>
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <div className="flex justify-center items-center space-x-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(getTotalPages() - 4, currentPage - 2)) + i;
                          if (pageNum > getTotalPages()) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 rounded transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {getPaginatedQuestions().map(q => (
                      <div key={q._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        {editingId === q._id ? (
                          <form onSubmit={handleEditQuestion} className="space-y-3">
                            <div>
                              <textarea
                                value={editQuestion.question}
                                onChange={e => setEditQuestion({...editQuestion, question: e.target.value})}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                                rows="3"
                                placeholder="Enter question text. Use LaTeX: $x^2$ for inline math, $$\frac{a}{b}$$ for display math"
                                required
                              />
                              {editQuestion.question && (
                                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-500 rounded border">
                                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                                  <div className="text-gray-800 dark:text-white">
                                    <MathText>{editQuestion.question}</MathText>
                                  </div>
                                </div>
                              )}
                            </div>
                            <select
                              value={editQuestion.chapter}
                              onChange={e => setEditQuestion({...editQuestion, chapter: e.target.value})}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                              required
                            >
                              <option value="">Select Chapter</option>
                              {chapters.map(ch => (
                                <option key={ch._id} value={ch.name}>{ch.name}{ch.description ? ` - ${ch.description}` : ''}</option>
                              ))}
                            </select>
                            {editQuestion.options.map((opt, i) => (
                              <div key={i} className="space-y-1">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const newOpts = [...editQuestion.options];
                                    newOpts[i] = e.target.value;
                                    setEditQuestion({...editQuestion, options: newOpts});
                                  }}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                                  placeholder={`Option ${i + 1} (LaTeX supported: $x^2$, $$\frac{a}{b}$$)`}
                                  required
                                />
                                {opt && (
                                  <div className="p-2 bg-gray-100 dark:bg-gray-500 rounded text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Preview: </span>
                                    <MathText>{opt}</MathText>
                                  </div>
                                )}
                              </div>
                            ))}
                            <select
                              value={typeof editQuestion.correctAnswer === 'number' ? editQuestion.correctAnswer : editQuestion.options.indexOf(editQuestion.correctAnswer)}
                              onChange={e => setEditQuestion({...editQuestion, correctAnswer: parseInt(e.target.value)})}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                              required
                            >
                              <option value={0}>A - {editQuestion.options[0] || 'Option 1'}</option>
                              <option value={1}>B - {editQuestion.options[1] || 'Option 2'}</option>
                              <option value={2}>C - {editQuestion.options[2] || 'Option 3'}</option>
                              <option value={3}>D - {editQuestion.options[3] || 'Option 4'}</option>
                            </select>
                            <input
                              type="number"
                              value={editQuestion.duration}
                              onChange={e => setEditQuestion({...editQuestion, duration: parseInt(e.target.value) || 60})}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                              placeholder="Duration (seconds)"
                              min="30"
                              max="600"
                            />
                            <textarea
                              value={editQuestion.explanation || ''}
                              onChange={e => setEditQuestion({...editQuestion, explanation: e.target.value})}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                              rows="3"
                              placeholder="Explanation (LaTeX supported: $x^2$, $$\frac{a}{b}$$)"
                            />
                            {editQuestion.explanation && (
                              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-500 rounded border">
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preview:</div>
                                <div className="text-gray-800 dark:text-white">
                                  <MathText>{editQuestion.explanation}</MathText>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50 text-white transition-colors">
                                Save
                              </button>
                              <button type="button" onClick={() => { setEditingId(null); setEditQuestion(null); }} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm text-white transition-colors">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800 dark:text-white">
                                  <MathText>{q.question}</MathText>
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Chapter: {q.chapter}</p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">Duration: {q.duration}s</p>
                                <ul className="mt-2 space-y-1">
                                  {q.options.map((opt, i) => (
                                    <li key={i} className={`text-sm ${opt === q.correctAnswer ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                      {String.fromCharCode(65 + i)}. <MathText>{opt}</MathText>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => { setEditingId(q._id); setEditQuestion({...q}); }}
                                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q._id)}
                                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm text-white transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'Quiz Config' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Quiz Configuration</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Configure exam and battle question counts for each chapter. Values cannot exceed available questions in the chapter.</p>
            
            {loading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading quiz configurations...</div>
            ) : (
              <div className="space-y-4">
                {chapters.map(chapter => {
                  const config = quizConfigs.find(c => c.chapterId === chapter._id) || {};
                  const questionCount = questions.filter(q => q.chapter === chapter.name).length;
                  
                  return (
                    <div key={chapter._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{chapter.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Subject: {chapter.subject}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Questions: {questionCount}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Exam Questions</label>
                          <input
                            type="number"
                            defaultValue={config.examQuestions || 50}
                            min="0"
                            max={questionCount}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            onBlur={(e) => handleUpdateQuizConfig(chapter._id, e.target.value, config.battleQuestions || 0)}
                            placeholder="Number of questions for exams"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max: {questionCount}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Battle Questions</label>
                          <input
                            type="number"
                            defaultValue={config.battleQuestions || 0}
                            min="0"
                            max={questionCount}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500 focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white transition-colors"
                            onBlur={(e) => handleUpdateQuizConfig(chapter._id, config.examQuestions || 50, e.target.value)}
                            placeholder="Number of questions for battles"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max: {questionCount}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Exam:</strong> {config.examQuestions || 50} questions | <strong>Battle:</strong> {config.battleQuestions || 0} questions will be randomly selected from {questionCount} available questions.
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          💡 Questions are randomly selected each time, ensuring variety. General quiz shows all unsolved questions progressively.
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {chapters.length === 0 && (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No chapters found. Create chapters first to configure quiz settings.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'Leaderboard Reset' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                ⚠️ <strong>SuperAdmin Approval Required:</strong> All leaderboard reset requests must be approved by SuperAdmin for security.
              </p>
            </div>
            
            {/* Quiz Leaderboard Reset */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">📚 Quiz Leaderboard Reset</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">This will reset:</h4>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                  <li>• Quiz scores and leaderboard rankings</li>
                  <li>• User quiz statistics and averages</li>
                  <li>• Quiz-related badges and achievements</li>
                  <li>• Division rankings and progress</li>
                  <li>• Quiz completion records</li>
                </ul>
                <p className="text-blue-600 dark:text-blue-400 text-sm mt-2 font-medium">
                  ✅ Battle leaderboard will NOT be affected
                </p>
              </div>
              <button
                onClick={handleResetQuizLeaderboard}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
              >
                {loading ? 'Submitting Request...' : 'Request Quiz Leaderboard Reset'}
              </button>
            </div>
            
            {/* Battle Leaderboard Reset */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">⚔️ Battle Leaderboard Reset</h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700 mb-4">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">This will reset:</h4>
                <ul className="text-red-700 dark:text-red-300 text-sm space-y-1">
                  <li>• Battle scores and global rankings</li>
                  <li>• Battle win/loss statistics</li>
                  <li>• Battle-related achievements</li>
                  <li>• Battle history and records</li>
                </ul>
                <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium">
                  ✅ Quiz leaderboard will NOT be affected
                </p>
              </div>
              <button
                onClick={handleResetBattleLeaderboard}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded disabled:opacity-50 text-white transition-colors"
              >
                {loading ? 'Submitting Request...' : 'Request Battle Leaderboard Reset'}
              </button>
            </div>
            
            {resetMsg && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-green-600 dark:text-green-400">{resetMsg}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'WhatsApp' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">WhatsApp Admin Panel</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Send notifications and messages to users via WhatsApp</p>
                <button
                  onClick={() => window.open('/admin/whatsapp', '_blank')}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                >
                  Open WhatsApp Panel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}