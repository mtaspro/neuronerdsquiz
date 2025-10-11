import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaCheck, FaTimes, FaPlus, FaTrophy, FaPen } from 'react-icons/fa';
import { useNotification } from '../components/NotificationSystem';
import { secureStorage } from '../utils/secureStorage';
import ImageMarker from '../components/ImageMarker';
import GlobalLoader from '../components/GlobalLoader';
import { useGlobalLoader } from '../hooks/useGlobalLoader';

const ExaminerDashboard = ({ isExaminer: propIsExaminer }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marksObtained: '', examinerComments: '', status: 'graded' });
  const [markedImages, setMarkedImages] = useState([]);
  const [markingImage, setMarkingImage] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [newExam, setNewExam] = useState({ title: '', description: '', subject: '', chapter: '', totalMarks: '', timeLimit: 180, expireDate: '', questionPapers: null });
  const [showCreateExam, setShowCreateExam] = useState(false);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamReport, setSelectedExamReport] = useState(null);
  const [examReport, setExamReport] = useState([]);
  const [isExaminer, setIsExaminer] = useState(false);
  const [isGlobalLoading, setGlobalLoading] = useGlobalLoader(true);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    const checkExaminerStatus = async () => {
      try {
        const userData = await secureStorage.getUserData();
        if (userData) {
          setIsExaminer(userData.isExaminer || userData.isAdmin || userData.isSuperAdmin);
        }
      } catch (error) {
        console.error('Error checking examiner status:', error);
      }
    };
    
    checkExaminerStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'exams') {
      fetchExams();
    } else {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Refresh submissions when switching between pending/graded tabs
  useEffect(() => {
    if (activeTab === 'pending' || activeTab === 'graded') {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/examiner/submissions?status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Handle both old format (direct array) and new format (object with submissions)
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      }
    } catch (error) {
      showError('Failed to fetch submissions');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };



  const fetchExams = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/examiner/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      showError('Failed to fetch exams');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/examiner/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        success('Exam deleted successfully!');
        setExams(prev => prev.filter(e => e._id !== examId));
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to delete exam');
      }
    } catch (error) {
      showError('Failed to delete exam');
    }
  };

  const fetchExamReport = async (examId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/examiner/exams/${examId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExamReport(data);
        setSelectedExamReport(examId);
      }
    } catch (error) {
      showError('Failed to fetch exam report');
    }
  };

  const handleGrade = async () => {
    if (!selectedSubmission) return;

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const formData = new FormData();
      formData.append('marksObtained', gradeForm.marksObtained);
      formData.append('examinerComments', gradeForm.examinerComments);
      formData.append('status', gradeForm.status);
      
      markedImages.forEach(file => {
        formData.append('markedImages', file);
      });

      const response = await fetch(`${apiUrl}/api/examiner/grade/${selectedSubmission._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        success('Submission graded successfully!');
        setSelectedSubmission(null);
        setGradeForm({ marksObtained: '', examinerComments: '', status: 'graded' });
        setMarkedImages([]);
        
        // Small delay to ensure database update is complete
        setTimeout(async () => {
          await fetchSubmissions();
          fetchLeaderboard();
        }, 500);
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to grade submission');
      }
    } catch (error) {
      showError('Failed to grade submission');
    }
  };

  const handleCreateExam = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      
      const formData = new FormData();
      formData.append('title', newExam.title);
      formData.append('description', newExam.description);
      formData.append('subject', newExam.subject);
      formData.append('chapter', newExam.chapter);
      formData.append('totalMarks', newExam.totalMarks);
      formData.append('timeLimit', newExam.timeLimit);
      formData.append('expireDate', newExam.expireDate);
      
      if (newExam.questionPapers) {
        Array.from(newExam.questionPapers).forEach(file => {
          formData.append('questionPapers', file);
        });
      }
      
      const response = await fetch(`${apiUrl}/api/examiner/exams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        success('Exam created successfully!');
        setShowCreateExam(false);
        setNewExam({ title: '', description: '', subject: '', chapter: '', totalMarks: '', timeLimit: 180, expireDate: '', questionPapers: null });
        fetchExams();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to create exam');
      }
    } catch (error) {
      showError('Failed to create exam');
    }
  };

  const openSubmissionModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      marksObtained: submission.marksObtained || '',
      examinerComments: submission.examinerComments || '',
      status: submission.status === 'pending' ? 'graded' : submission.status
    });
    setMarkedImages([]);
    setMarkingImage(null);
  };

  const handleMarkImage = (imageUrl, isMarkedImage = false) => {
    // If it's a marked image, pass it as existing marked image
    setMarkingImage({ originalUrl: imageUrl, isMarkedImage });
  };

  const handleSaveMarkedImage = (blob) => {
    const file = new File([blob], `marked-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setMarkedImages(prev => [...prev, file]);
    setMarkingImage(null);
    // Force re-render to show the new marked image
    setSelectedSubmission(prev => ({ ...prev }));
  };



  return (
    <GlobalLoader isLoading={isGlobalLoading} skeletonType="dashboard">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Examiner Dashboard</h1>
          {isExaminer && (
            <button
              onClick={() => setShowCreateExam(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <FaPlus className="mr-2" />
              Create Exam
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {['pending', 'graded', 'exams'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'exams' ? 'Manage Exams' :
               `${tab.charAt(0).toUpperCase() + tab.slice(1)} Submissions`}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'exams' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Manage Exams</h2>
            <div className="space-y-4">
              {exams.map(exam => (
                <div key={exam._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{exam.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{exam.description}</p>
                      <p className="text-sm text-gray-500">Subject: {exam.subject} | Chapter: {exam.chapter}</p>
                      <p className="text-sm text-gray-500">Total Marks: {exam.totalMarks} | Time: {exam.timeLimit} min</p>
                      <p className="text-sm text-gray-500">Created by: {exam.createdBy?.username}</p>
                      {exam.questionPapers && exam.questionPapers.length > 0 && (
                        <p className="text-sm text-blue-600 dark:text-blue-400">📄 {exam.questionPapers.length} question paper(s) attached</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {isExaminer && (
                        <>
                          <button
                            onClick={() => fetchExamReport(exam._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {submissions.map(submission => (
              <motion.div
                key={submission._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold mb-2">{submission.examId?.title || 'Deleted Exam'}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">Student: {submission.username}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
                
                {submission.status === 'graded' && (
                  <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Score: {submission.marksObtained}/{submission.totalMarks}
                    </p>
                  </div>
                )}

                {isExaminer && (
                  <button
                    onClick={() => openSubmissionModal(submission)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FaEye className="mr-2" />
                    {submission.status === 'pending' ? 'Grade Submission' : 'View Details'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Tutorial Section */}
        {(activeTab === 'pending' || activeTab === 'graded') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mt-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">📚 How to Grade Answer Papers - Tutorial</h2>
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-3">
                <h3 className="font-semibold text-base mb-2">1. Click the Grade Button</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Start by clicking the "Grade Submission" button on any pending submission.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729588/1_fss2if.png" alt="Click grade button" className="w-full max-w-xs rounded border" />
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-green-500 pl-3">
                <h3 className="font-semibold text-base mb-2">2. Mark Answer Papers</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Answer papers will appear. Tap the pencil icon on any paper to start marking it.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729588/2_j6c1fc.png" alt="Mark papers" className="w-full max-w-xs rounded border" />
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-purple-500 pl-3">
                <h3 className="font-semibold text-base mb-2">3. Marking Tools</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Use the available tools: Pencil for drawing, Text button for annotations, color palette, width slider, and undo/redo buttons.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729589/3_cqcfcw.png" alt="Marking tools" className="w-full max-w-xs rounded border" />
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-orange-500 pl-3">
                <h3 className="font-semibold text-base mb-2">4. Add Text Annotations</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Click the text input button [A] and tap anywhere on the paper to add comments, marks, or feedback.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729605/4_olkmju.png" alt="Text input" className="w-full max-w-xs rounded border" />
                  <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729605/5_q7qpmo.png" alt="Add text" className="w-full max-w-xs rounded border" />
                </div>
              </div>

              {/* Step 5 */}
              <div className="border-l-4 border-red-500 pl-3">
                <h3 className="font-semibold text-base mb-2">5. Save Marked Paper</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">After marking, click the Save button to save your annotations.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729606/6_lnhf9f.png" alt="Save marked paper" className="w-full max-w-xs rounded border" />
              </div>

              {/* Step 6 */}
              <div className="border-l-4 border-teal-500 pl-3">
                <h3 className="font-semibold text-base mb-2">6. Mark Remaining Papers</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Repeat the same process for all remaining answer papers.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729606/7_vv2q8c.png" alt="Mark remaining papers" className="w-full max-w-xs rounded border" />
              </div>

              {/* Step 7 */}
              <div className="border-l-4 border-indigo-500 pl-3">
                <h3 className="font-semibold text-base mb-2">7. Fill Grading Form & Save</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm">Scroll down, fill in the total marks, examiner comments, and most importantly click the "Save Grade" button to complete the grading process.</p>
                <img src="https://res.cloudinary.com/dxqtqnfgf/image/upload/v1759729606/8_vctfka.png" alt="Save grade" className="w-full max-w-xs rounded border" />
              </div>
            </div>
          </div>
        )}

        {/* Grading Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" data-lenis-prevent>
            <div className="min-h-full flex items-start justify-center p-4 pt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-4xl w-full mx-2 sm:mx-0 my-4 max-h-[90vh] overflow-y-auto"
                data-lenis-prevent
              >
                <h2 className="text-2xl font-bold mb-4">
                  {selectedSubmission.examId?.title || 'Deleted Exam'} - {selectedSubmission.username}
                </h2>
              
              {/* Answer Images */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Submitted Answers:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedSubmission.answerImages.map((image, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden relative group">
                      <img
                        src={image}
                        alt={`Answer ${index + 1}`}
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                      <button
                        onClick={() => handleMarkImage(image, false)}
                        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-sm"
                        title="Mark this image"
                      >
                        <FaPen className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marked Images Display - Show both existing and newly marked */}
              {((selectedSubmission.markedImages && selectedSubmission.markedImages.length > 0) || markedImages.length > 0) && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Marked Answer Papers:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Existing marked images */}
                    {selectedSubmission.markedImages && selectedSubmission.markedImages.map((image, index) => (
                      <div key={`existing-${index}`} className="border border-green-300 dark:border-green-600 rounded-lg overflow-hidden relative group">
                        <img
                          src={image}
                          alt={`Marked Answer ${index + 1}`}
                          className="w-full h-auto"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                        <button
                          onClick={() => handleMarkImage(image, true)}
                          className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-sm"
                          title="Edit marked image"
                        >
                          <FaPen className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                    {/* Newly marked images */}
                    {markedImages.map((file, index) => (
                      <div key={`new-${index}`} className="border border-blue-300 dark:border-blue-600 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New Marked Answer ${index + 1}`}
                          className="w-full h-auto"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm">
                          New Marking
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grading Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Marks Obtained (out of {selectedSubmission.totalMarks || selectedSubmission.examId?.totalMarks || 'N/A'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSubmission.totalMarks || selectedSubmission.examId?.totalMarks || 100}
                    value={gradeForm.marksObtained}
                    onChange={(e) => setGradeForm({...gradeForm, marksObtained: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Examiner Comments</label>
                  <textarea
                    value={gradeForm.examinerComments}
                    onChange={(e) => setGradeForm({...gradeForm, examinerComments: e.target.value})}
                    rows="4"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={gradeForm.status}
                    onChange={(e) => setGradeForm({...gradeForm, status: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="graded">Graded</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                {isExaminer && (
                  <button
                    onClick={handleGrade}
                    className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <FaCheck className="mr-2" />
                    Save Grade
                  </button>
                )}
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {isExaminer ? 'Cancel' : 'Close'}
                </button>
              </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Create Exam Modal */}
        {showCreateExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-lenis-prevent>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full"
            >
              <h2 className="text-2xl font-bold mb-4">Create New Written Exam</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Exam Title</label>
                  <input
                    type="text"
                    value={newExam.title}
                    onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newExam.description}
                    onChange={(e) => setNewExam({...newExam, description: e.target.value})}
                    rows="3"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={newExam.subject}
                      onChange={(e) => setNewExam({...newExam, subject: e.target.value})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Chapter</label>
                    <input
                      type="text"
                      value={newExam.chapter}
                      onChange={(e) => setNewExam({...newExam, chapter: e.target.value})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Total Marks</label>
                    <input
                      type="number"
                      value={newExam.totalMarks}
                      onChange={(e) => setNewExam({...newExam, totalMarks: e.target.value})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={newExam.timeLimit}
                      onChange={(e) => setNewExam({...newExam, timeLimit: e.target.value})}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expire Date</label>
                  <input
                    type="datetime-local"
                    value={newExam.expireDate}
                    onChange={(e) => setNewExam({...newExam, expireDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Question Paper (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setNewExam({...newExam, questionPapers: e.target.files})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload question paper images (optional)</p>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleCreateExam}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors"
                >
                  Create Exam
                </button>
                <button
                  onClick={() => setShowCreateExam(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Exam Report Modal */}
        {selectedExamReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-lenis-prevent>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              data-lenis-prevent
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Exam Participation Report</h2>
                <button
                  onClick={() => setSelectedExamReport(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Student</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Email</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Started</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Submitted</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Time Info</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examReport.map(student => (
                      <tr key={student.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{student.username}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{student.email}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.examStarted === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {student.examStarted}
                          </span>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.submitted === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {student.submitted}
                          </span>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            student.status === 'graded' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            student.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            student.status === 'time_expired' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            student.status === 'started' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}>
                            {student.status === 'not_started' ? 'Not Started' :
                             student.status === 'time_expired' ? 'Time Expired' :
                             student.status === 'started' ? 'In Progress' :
                             student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">
                          {student.timeRemaining ? (
                            <div>
                              <div className={`font-medium ${
                                student.timeRemaining === 'Expired' ? 'text-red-600' : 'text-orange-600'
                              }`}>
                                {student.timeRemaining === 'Expired' ? '⏰ Expired' : `⏱️ ${student.timeRemaining}`}
                              </div>
                              {student.examStartTime && (
                                <div className="text-xs text-gray-500">
                                  Started: {new Date(student.examStartTime).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : student.examStartTime ? (
                            <div className="text-xs text-gray-500">
                              Started: {new Date(student.examStartTime).toLocaleString()}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                          {student.status === 'graded' ? `${student.marksObtained}/${student.totalMarks}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setSelectedExamReport(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Image Marker Modal */}
        {markingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" data-lenis-prevent>
            <div className="w-full h-full">
              <ImageMarker
                imageUrl={markingImage?.originalUrl || markingImage}
                existingMarkedImage={markingImage?.isMarkedImage ? markingImage.originalUrl : null}
                onSave={handleSaveMarkedImage}
                onCancel={() => setMarkingImage(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </GlobalLoader>
  );
};

export default ExaminerDashboard;