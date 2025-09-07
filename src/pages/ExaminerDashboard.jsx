import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaCheck, FaTimes, FaPlus, FaTrophy, FaPen } from 'react-icons/fa';
import { useNotification } from '../components/NotificationSystem';
import { secureStorage } from '../utils/secureStorage';
import ImageMarker from '../components/ImageMarker';

const ExaminerDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marksObtained: '', examinerComments: '', status: 'graded' });
  const [markedImages, setMarkedImages] = useState([]);
  const [markingImage, setMarkingImage] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [newExam, setNewExam] = useState({ title: '', description: '', subject: '', chapter: '', totalMarks: '', timeLimit: 180, expireDate: '' });
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'exams') {
      fetchExams();
    } else {
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
        setSubmissions(data);
      }
    } catch (error) {
      showError('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/examiner/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
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
        // Remove from current submissions list immediately
        setSubmissions(prev => prev.filter(s => s._id !== selectedSubmission._id));
        fetchLeaderboard();
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
      const response = await fetch(`${apiUrl}/api/examiner/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newExam)
      });

      if (response.ok) {
        success('Exam created successfully!');
        setShowCreateExam(false);
        setNewExam({ title: '', description: '', subject: '', chapter: '', totalMarks: '', timeLimit: 180, expireDate: '' });
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
      status: submission.status
    });
    setMarkedImages([]);
    setMarkingImage(null);
  };

  const handleMarkImage = (imageUrl) => {
    // Use CORS proxy for Cloudinary images to avoid tainted canvas
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${imageUrl}`;
    setMarkingImage(proxyUrl);
  };

  const handleSaveMarkedImage = (blob) => {
    const file = new File([blob], `marked-${Date.now()}.png`, { type: 'image/png' });
    setMarkedImages(prev => [...prev, file]);
    setMarkingImage(null);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Examiner Dashboard</h1>
          <button
            onClick={() => setShowCreateExam(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Exam
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {['pending', 'graded', 'exams', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'leaderboard' ? 'Leaderboard' : 
               tab === 'exams' ? 'Manage Exams' :
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
                    </div>
                    <button
                      onClick={() => handleDeleteExam(exam._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FaTrophy className="text-yellow-500 text-2xl mr-3" />
              <h2 className="text-2xl font-bold">Written Exam Leaderboard</h2>
            </div>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400' :
                    index === 2 ? 'bg-orange-100 dark:bg-orange-900/20 border-2 border-orange-400' :
                    'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{entry.username}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.examCount} exams • Avg: {entry.averageMarks.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {entry.totalMarks}
                    </div>
                    <div className="text-sm text-gray-500">Total Points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

                <button
                  onClick={() => openSubmissionModal(submission)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FaEye className="mr-2" />
                  {submission.status === 'pending' ? 'Grade Submission' : 'View Details'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Grading Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-lenis-prevent>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              data-lenis-prevent
            >
              <h2 className="text-2xl font-bold mb-4">
                {selectedSubmission.examId?.title || 'Deleted Exam'} - {selectedSubmission.username}
              </h2>
              
              {/* Answer Images */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Submitted Answers:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubmission.answerImages.map((image, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden relative group">
                      <img
                        src={image}
                        alt={`Answer ${index + 1}`}
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                      <button
                        onClick={() => handleMarkImage(image)}
                        className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark this image"
                      >
                        <FaPen />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marked Images Display */}
              {selectedSubmission.markedImages && selectedSubmission.markedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Marked Answer Papers:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSubmission.markedImages.map((image, index) => (
                      <div key={index} className="border border-green-300 dark:border-green-600 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Marked Answer ${index + 1}`}
                          className="w-full h-auto"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
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

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleGrade}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FaCheck className="mr-2" />
                  Save Grade
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
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

        {/* Image Marker Modal */}
        {markingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" data-lenis-prevent>
            <div className="w-full h-full">
              <ImageMarker
                imageUrl={markingImage}
                onSave={handleSaveMarkedImage}
                onCancel={() => setMarkingImage(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExaminerDashboard;