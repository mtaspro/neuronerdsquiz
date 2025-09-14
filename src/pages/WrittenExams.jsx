import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaClock, FaFileAlt, FaCheckCircle, FaHourglassHalf, FaTimes } from 'react-icons/fa';
import { useNotification } from '../components/NotificationSystem';
import { secureStorage } from '../utils/secureStorage';

const WrittenExams = () => {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchExams();
    fetchMySubmissions();
  }, []);

  const fetchExams = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/written-exam/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      showError('Failed to fetch written exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/written-exam/my-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const startExam = async (exam) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/written-exam/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId: exam._id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveSubmission(data.submission);
        setSelectedExam(exam);
        
        const startTime = new Date(data.submission.examStartTime).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = (exam.timeLimit * 60) - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to start exam');
      }
    } catch (error) {
      showError('Failed to start exam');
    }
  };

  const isExamStarted = (examId) => {
    return submissions.some(sub => sub.examId?._id === examId && sub.status === 'started');
  };

  const openUploadDialog = (exam) => {
    const submission = submissions.find(sub => sub.examId?._id === exam._id && sub.status === 'started');
    if (submission) {
      setActiveSubmission(submission);
      setSelectedExam(exam);
      
      const startTime = new Date(submission.examStartTime).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = (exam.timeLimit * 60) - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      showError('Maximum 10 images allowed');
      return;
    }
    setSelectedFiles(files);
  };

  const handleSubmit = async (examId) => {
    if (selectedFiles.length === 0) {
      showError('Please select at least one answer image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('examId', examId);
      selectedFiles.forEach(file => {
        formData.append('answerImages', file);
      });

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await fetch(`${apiUrl}/api/written-exam/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        success('Answer submitted successfully!');
        setSelectedExam(null);
        setSelectedFiles([]);
        setActiveSubmission(null);
        setTimeLeft(null);
        fetchMySubmissions();
      } else {
        const data = await response.json();
        showError(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      showError('Failed to submit answer');
    } finally {
      setUploading(false);
    }
  };

  const getSubmissionStatus = (examId) => {
    return submissions.find(sub => sub.examId._id === examId);
  };

  const isExamExpired = (exam) => {
    return new Date() > new Date(exam.expireDate);
  };

  // Countdown timer effect
  useEffect(() => {
    if (!activeSubmission || !timeLeft || !selectedExam) return;
    
    const timer = setInterval(() => {
      const startTime = new Date(activeSubmission.examStartTime).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = (selectedExam.timeLimit * 60) - elapsed;
      
      if (remaining <= 0) {
        if (selectedFiles.length === 0) {
          showError('Time expired! Answer not submitted within time.');
          setSelectedExam(null);
          setActiveSubmission(null);
          setTimeLeft(null);
        }
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeSubmission, selectedExam, selectedFiles.length]);

  // Check for active exams on page load
  useEffect(() => {
    const activeExam = submissions.find(sub => sub.status === 'started' && sub.examId);
    if (activeExam && exams.length > 0) {
      const exam = exams.find(e => e._id === activeExam.examId?._id);
      if (exam) {
        setActiveSubmission(activeExam);
        setSelectedExam(exam);
        
        const startTime = new Date(activeExam.examStartTime).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = (exam.timeLimit * 60) - elapsed;
        
        if (remaining > 0) {
          setTimeLeft(remaining);
        }
      }
    }
  }, [exams, submissions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Written Exams</h1>

        {/* Available Exams */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          {exams.map(exam => {
            const submission = getSubmissionStatus(exam._id);
            return (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-xl font-semibold mb-2">{exam.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{exam.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <FaFileAlt className="mr-2" />
                    <span>Subject: {exam.subject}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="mr-2" />
                    <span>Time: {exam.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center">
                    <span>Total Marks: {exam.totalMarks}</span>
                  </div>
                </div>

                {submission ? (
                  <div className={`p-3 rounded-lg ${
                    submission.status === 'graded' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : submission.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    <div className="flex items-center">
                      {submission.status === 'graded' ? <FaCheckCircle className="mr-2" /> : <FaHourglassHalf className="mr-2" />}
                      <span className="font-medium">
                        {submission.status === 'graded' ? 'Graded' : 
                         submission.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>
                    {submission.status === 'graded' && (
                      <div className="mt-2">
                        <p>Score: {submission.marksObtained}/{submission.totalMarks}</p>
                        {submission.examinerComments && (
                          <p className="text-sm mt-1">Comments: {submission.examinerComments}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : isExamExpired(exam) ? (
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300">
                    <div className="flex items-center">
                      <FaTimes className="mr-2" />
                      <span className="font-medium">Absent</span>
                    </div>
                    <p className="text-sm mt-1">Exam expired on {new Date(exam.expireDate).toLocaleDateString()}</p>
                  </div>
                ) : isExamStarted(exam._id) ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                      <div className="flex items-center">
                        <FaClock className="mr-2" />
                        <span className="font-medium">Exam Started</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openUploadDialog(exam)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Upload Answer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startExam(exam)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Start Exam
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Upload Modal */}
        {selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" data-lenis-prevent>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              data-lenis-prevent
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Submit Answer: {selectedExam.title}</h2>
                {timeLeft !== null && (
                  <div className={`text-lg font-bold px-3 py-1 rounded ${
                    timeLeft <= 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Time Left: {formatTime(timeLeft)}
                  </div>
                )}
              </div>
              
              {/* Question Papers */}
              {selectedExam.questionPapers && selectedExam.questionPapers.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-blue-600 dark:text-blue-400">📄 Question Papers:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedExam.questionPapers.map((paper, index) => (
                      <div key={index} className="border border-blue-300 dark:border-blue-600 rounded-lg overflow-hidden">
                        <img
                          src={paper}
                          alt={`Question Paper ${index + 1}`}
                          className="w-full h-auto cursor-pointer hover:opacity-80"
                          onClick={() => window.open(paper, '_blank')}
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click images to view full size</p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Upload Answer Images (Max 10 files)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Upload clear photos of your written answers. Supported formats: JPG, PNG, etc.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Selected Files ({selectedFiles.length}):</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => handleSubmit(selectedExam._id)}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Submit Answer
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedExam(null);
                    setSelectedFiles([]);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* My Submissions */}
        {submissions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Submissions</h2>
            <div className="space-y-4">
              {submissions.map(submission => (
                <motion.div
                  key={submission._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{submission.examId?.title || 'Deleted Exam'}</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === 'graded' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : submission.status === 'rejected'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </div>
                  </div>
                  
                  {submission.status === 'graded' && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Score:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {submission.marksObtained}/{submission.totalMarks}
                        </span>
                      </div>
                      {submission.examinerComments && (
                        <div>
                          <span className="font-medium">Examiner Comments:</span>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">{submission.examinerComments}</p>
                        </div>
                      )}
                      
                      {/* Marked Images */}
                      {submission.markedImages && submission.markedImages.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium mb-2 text-green-600 dark:text-green-400">Marked Answer Papers:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {submission.markedImages.map((image, index) => (
                              <div key={index} className="border border-green-300 dark:border-green-600 rounded overflow-hidden">
                                <img
                                  src={image}
                                  alt={`Marked Answer ${index + 1}`}
                                  className="w-full h-20 object-cover cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(image, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click images to view full size</p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Graded on: {new Date(submission.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WrittenExams;