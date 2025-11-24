import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import getEnvironmentConfig from '../config/environment';
import { secureStorage } from '../utils/secureStorage';

const { apiUrl: API_URL } = getEnvironmentConfig();

export default function ProgressEditor() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);
  const [examSyllabus, setExamSyllabus] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = secureStorage.getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [subjectsRes, examsRes] = await Promise.all([
        axios.get(`${API_URL}/api/progress/subjects`, { headers }),
        axios.get(`${API_URL}/api/progress/exams`, { headers })
      ]);
      setSubjects(subjectsRes.data.subjects);
      const examsData = examsRes.data.exams.map(exam => ({
        ...exam,
        syllabus: exam.syllabus?.map(syl => ({
          subjectId: syl.subjectId?._id || syl.subjectId,
          chapters: syl.chapters
        }))
      }));
      setExams(examsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: editingSubject?._id,
      name: formData.get('name'),
      order: parseInt(formData.get('order')),
      category: formData.get('category'),
      chapters: formData.get('chapters').split('\n').filter(c => c.trim())
    };

    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/progress/admin/subject`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSubjectForm(false);
      setEditingSubject(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save subject:', error);
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return;
    try {
      const token = secureStorage.getToken();
      await axios.delete(`${API_URL}/api/progress/admin/subject/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  const saveExam = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: editingExam?._id,
      name: formData.get('name'),
      date: formData.get('date'),
      syllabus: examSyllabus.filter(s => s.chapters.length > 0)
    };

    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/progress/admin/exam`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowExamForm(false);
      setEditingExam(null);
      setExamSyllabus([]);
      fetchData();
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  const toggleSubjectInSyllabus = (subjectId) => {
    const exists = examSyllabus.find(s => s.subjectId === subjectId);
    if (exists) {
      setExamSyllabus(examSyllabus.filter(s => s.subjectId !== subjectId));
    } else {
      const subject = subjects.find(s => s._id === subjectId);
      setExamSyllabus([...examSyllabus, { subjectId, chapters: subject.chapters }]);
    }
  };

  const toggleChapterInSyllabus = (subjectId, chapter) => {
    setExamSyllabus(examSyllabus.map(s => {
      if (s.subjectId === subjectId) {
        const hasChapter = s.chapters.includes(chapter);
        return {
          ...s,
          chapters: hasChapter 
            ? s.chapters.filter(c => c !== chapter)
            : [...s.chapters, chapter]
        };
      }
      return s;
    }));
  };

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try {
      const token = secureStorage.getToken();
      await axios.delete(`${API_URL}/api/progress/admin/exam/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete exam:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Progress Editor</h1>
          <p className="text-gray-300">Manage subjects, chapters, and exams</p>
        </motion.div>

        {/* Subjects Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Subjects</h2>
            <button
              onClick={() => { setShowSubjectForm(true); setEditingSubject(null); }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Subject
            </button>
          </div>

          {showSubjectForm && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-4">
              <form onSubmit={saveSubject}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    name="name"
                    defaultValue={editingSubject?.name}
                    placeholder="Subject Name"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  />
                  <input
                    name="order"
                    type="number"
                    defaultValue={editingSubject?.order || subjects.length + 1}
                    placeholder="Order"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  />
                  <select
                    name="category"
                    defaultValue={editingSubject?.category || 'BEI'}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  >
                    <option value="BEI">BEI</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
                <textarea
                  name="chapters"
                  defaultValue={editingSubject?.chapters?.join('\n')}
                  placeholder="Chapters (one per line)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
                  required
                />
                <div className="flex gap-2 mt-4">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSubjectForm(false); setEditingSubject(null); }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="space-y-3">
            {subjects.map((subject) => (
              <motion.div
                key={subject._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-white font-semibold">{subject.name}</h3>
                  <p className="text-gray-300 text-sm">{subject.category} • {subject.chapters.length} chapters</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingSubject(subject); setShowSubjectForm(true); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSubject(subject._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Exams Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Exams</h2>
            <button
              onClick={() => { setShowExamForm(true); setEditingExam(null); setExamSyllabus([]); }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Exam
            </button>
          </div>

          {showExamForm && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-4">
              <form onSubmit={saveExam}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    name="name"
                    defaultValue={editingExam?.name}
                    placeholder="Exam Name"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  />
                  <input
                    name="date"
                    type="date"
                    defaultValue={editingExam?.date?.split('T')[0]}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white mb-2 font-medium">Syllabus (Select Subjects & Chapters)</label>
                  <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-black/20 rounded-lg">
                    {subjects.map(subject => {
                      const isSelected = examSyllabus.some(s => s.subjectId === subject._id);
                      const selectedChapters = examSyllabus.find(s => s.subjectId === subject._id)?.chapters || [];
                      
                      return (
                        <div key={subject._id} className="bg-white/5 rounded-lg p-3">
                          <label className="flex items-center space-x-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSubjectInSyllabus(subject._id)}
                              className="w-4 h-4 rounded accent-blue-500"
                            />
                            <span className="text-white font-semibold">{subject.name}</span>
                          </label>
                          
                          {isSelected && (
                            <div className="ml-6 grid grid-cols-2 gap-2 mt-2">
                              {subject.chapters.map((chapter, i) => (
                                <label key={i} className="flex items-center space-x-2 cursor-pointer text-sm">
                                  <input
                                    type="checkbox"
                                    checked={selectedChapters.includes(chapter)}
                                    onChange={() => toggleChapterInSyllabus(subject._id, chapter)}
                                    className="w-3 h-3 rounded accent-cyan-500"
                                  />
                                  <span className="text-gray-300">{chapter}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowExamForm(false); setEditingExam(null); setExamSyllabus([]); }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="space-y-3">
            {exams.map((exam) => (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-white font-semibold">{exam.name}</h3>
                  <p className="text-gray-300 text-sm">{new Date(exam.date).toLocaleDateString()}</p>
                  {exam.syllabus?.length > 0 && (
                    <p className="text-gray-400 text-xs mt-1">{exam.syllabus.length} subjects in syllabus</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingExam(exam); setExamSyllabus(exam.syllabus || []); setShowExamForm(true); }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteExam(exam._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
