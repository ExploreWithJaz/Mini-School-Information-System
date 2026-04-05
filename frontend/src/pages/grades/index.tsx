"use client"

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { apiCall } from "@/lib/api";
import Modal from "@/components/modal";

interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentApi {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  course_id: string;
  created_at: string;
  updated_at: string;
}

interface Grade {
  id: string;
  studentID: string;
  subjectID: string;
  courseID: string;
  prelim: number;
  midterm: number;
  finals: number;
  finalGrade: number;
  remarks: string;
  encodedByUserID: string;
  createdAt: string;
  updatedAt: string;
}

interface CourseOption {
  id: string;
  code: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  title: string;
}

export default function Grades() {
  const { user, token, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectMap, setSubjectMap] = useState<{ [key: string]: string }>({});
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [editingRemarks, setEditingRemarks] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingGrades, setEditingGrades] = useState<{
    [key: string]: { prelim?: number; midterm?: number; finals?: number }
  }>({});
  const [gradeFilter, setGradeFilter] = useState({
    minGrade: "",
    maxGrade: "",
    remarks: "",
    subjectId: ""
  });

  // Fetch students
  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (search) params.append("search", search);
      if (courseId) params.append("courseId", courseId);

      const response = await apiCall(`/students?${params.toString()}`, { token });

      const mappedStudents: Student[] = (response.data as StudentApi[]).map((s) => ({
        id: s.id,
        studentNumber: s.student_number,
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        birthDate: s.birth_date,
        courseId: s.course_id,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));

      setStudents(mappedStudents);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // Fetch grades for selected student
  const fetchGradesForStudent = async (studentId: string) => {
    try {
      setGradesLoading(true);
      const data = await apiCall(`/students/${studentId}/grades`, { token });
      
      // Convert string numeric fields to numbers
      const convertedGrades = (data as any[]).map((g: any) => ({
        ...g,
        prelim: typeof g.prelim === 'string' ? parseFloat(g.prelim) : g.prelim,
        midterm: typeof g.midterm === 'string' ? parseFloat(g.midterm) : g.midterm,
        finals: typeof g.finals === 'string' ? parseFloat(g.finals) : g.finals,
        finalGrade: typeof g.finalGrade === 'string' ? parseFloat(g.finalGrade) : g.finalGrade
      }));
      
      setGrades(convertedGrades);
      setEditingRemarks({});
      setEditingGrades({});
      setGradeFilter({ minGrade: "", maxGrade: "", remarks: "", subjectId: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch grades");
      setGrades([]);
    } finally {
      setGradesLoading(false);
    }
  };

  // Handle view grades
  const handleViewGrades = async (student: Student) => {
    setSelectedStudent(student);
    setIsGradesModalOpen(true);
    await fetchGradesForStudent(student.id);
  };

  // Update remarks
  const handleUpdateRemarks = async (gradeId: string) => {
    if (!selectedStudent) return;

    try {
      setIsSaving(true);
      await apiCall(`/grades/${gradeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          remarks: editingRemarks[gradeId] || ""
        }),
        token
      });

      // Update local state
      setGrades((prev) =>
        prev.map((g) =>
          g.id === gradeId ? { ...g, remarks: editingRemarks[gradeId] || "" } : g
        )
      );

      setEditingGradeId(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update remarks");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate final grade (weighted average: prelim 20%, midterm 30%, finals 50%)
  const calculateFinalGrade = (prelim: number, midterm: number, finals: number): number => {
    return (prelim * 0.2) + (midterm * 0.3) + (finals * 0.5);
  };

  // Update grades (prelim, midterm, finals)
  const handleUpdateGrades = async (gradeId: string) => {
    if (!selectedStudent || !editingGrades[gradeId]) return;

    try {
      setIsSaving(true);
      const grade = grades.find((g) => g.id === gradeId);
      if (!grade) return;

      const prelim = editingGrades[gradeId].prelim ?? grade.prelim;
      const midterm = editingGrades[gradeId].midterm ?? grade.midterm;
      const finals = editingGrades[gradeId].finals ?? grade.finals;
      const finalGrade = calculateFinalGrade(prelim, midterm, finals);

      await apiCall(`/grades/${gradeId}`, {
        method: "PATCH",
        body: JSON.stringify({
          prelim,
          midterm,
          finals,
          finalGrade
        }),
        token
      });

      // Update local state
      setGrades((prev) =>
        prev.map((g) =>
          g.id === gradeId
            ? { ...g, prelim, midterm, finals, finalGrade }
            : g
        )
      );

      setEditingGradeId(null);
      setEditingGrades((prev) => {
        const newState = { ...prev };
        delete newState[gradeId];
        return newState;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update grades");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter grades based on criteria
  const getFilteredGrades = (): Grade[] => {
    return grades.filter((grade) => {
      const matchesMinGrade = !gradeFilter.minGrade || grade.finalGrade >= parseFloat(gradeFilter.minGrade);
      const matchesMaxGrade = !gradeFilter.maxGrade || grade.finalGrade <= parseFloat(gradeFilter.maxGrade);
      const matchesRemarks = !gradeFilter.remarks || grade.remarks.toLowerCase().includes(gradeFilter.remarks.toLowerCase());
      const matchesSubject = !gradeFilter.subjectId || grade.subjectID === gradeFilter.subjectId;

      return matchesMinGrade && matchesMaxGrade && matchesRemarks && matchesSubject;
    });
  };

  // Load initial data
  useEffect(() => {
    if (!authLoading && user && token) {
      fetchStudents(1);
      fetchCourses();
      fetchSubjects();
    }
  }, [authLoading, user, token]);

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await apiCall("/courses", { token });
      setCourses(
        (response as Array<{ id: string; code: string; name: string }>).map(
          (course) => ({
            id: course.id,
            code: course.code,
            name: course.name
          })
        )
      );
    } catch {
      setCourses([]);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await apiCall("/subjects", { token });
      const subjectsData = (response as Subject[]);
      setSubjects(subjectsData);
      
      // Create a map of subject ID to title for quick lookup
      const map: { [key: string]: string } = {};
      subjectsData.forEach((subject) => {
        map[subject.id] = subject.title;
      });
      setSubjectMap(map);
    } catch {
      setSubjects([]);
      setSubjectMap({});
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, courseId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchStudents(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchStudents(pagination.page + 1);
    }
  };

  const formatDate = (date: string) => {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
      ? "N/A"
      : parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
  };

  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <section className="bg-[#f5f6fb] min-h-screen p-5">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grades Management</h1>
        <p className="text-gray-500">View and manage student grades</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 mb-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <input
            type="text"
            placeholder="Search by name, student number, or email..."
            value={search}
            onChange={handleSearch}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Course
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading students...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-10">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="flex items-center justify-center p-10">
            <div className="text-center">
              <p className="text-gray-500 text-sm">No students found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Student Number
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Full Name
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Email
                    </th>
                    <th className="text-left text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Date of Birth
                    </th>
                    <th className="text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Status
                    </th>
                    <th className="text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 px-6 py-3">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-medium text-gray-700">
                        {student.studentNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(student.birthDate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block text-[11px] font-medium px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewGrades(student)}
                          className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          View Grades
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span> students
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => fetchStudents(page)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                          pagination.page === page
                            ? "bg-indigo-500 text-white"
                            : "text-gray-700 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isGradesModalOpen}
        onClose={() => {
          if (isSaving) return;
          setIsGradesModalOpen(false);
          setSelectedStudent(null);
          setGrades([]);
          setEditingGradeId(null);
          setEditingRemarks({});
          setEditingGrades({});
          setGradeFilter({ minGrade: "", maxGrade: "", remarks: "", subjectId: "" });
        }}
        title={`Grades for ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        size="xl"
      >
        {gradesLoading ? (
          <div className="flex justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading grades...</p>
            </div>
          </div>
        ) : grades.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No grades found for this student.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter Grades</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Grade
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={gradeFilter.minGrade}
                    onChange={(e) =>
                      setGradeFilter((prev) => ({ ...prev, minGrade: e.target.value }))
                    }
                    placeholder="Min"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Grade
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={gradeFilter.maxGrade}
                    onChange={(e) =>
                      setGradeFilter((prev) => ({ ...prev, maxGrade: e.target.value }))
                    }
                    placeholder="Max"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={gradeFilter.subjectId}
                    onChange={(e) =>
                      setGradeFilter((prev) => ({ ...prev, subjectId: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Subjects</option>
                    {[...new Set(grades.map((g) => g.subjectID))].map((subjectId) => (
                      <option key={subjectId} value={subjectId}>
                        {subjectMap[subjectId] || subjectId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={gradeFilter.remarks}
                    onChange={(e) =>
                      setGradeFilter((prev) => ({ ...prev, remarks: e.target.value }))
                    }
                    placeholder="Search remarks..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {(gradeFilter.minGrade || gradeFilter.maxGrade || gradeFilter.remarks || gradeFilter.subjectId) && (
                <button
                  onClick={() =>
                    setGradeFilter({ minGrade: "", maxGrade: "", remarks: "", subjectId: "" })
                  }
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-center font-semibold">Prelim</th>
                    <th className="px-4 py-3 text-center font-semibold">Midterm</th>
                    <th className="px-4 py-3 text-center font-semibold">Finals</th>
                    <th className="px-4 py-3 text-center font-semibold">Final Grade</th>
                    <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredGrades().length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        No grades match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    getFilteredGrades().map((grade) => (
                      <tr key={grade.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{subjectMap[grade.subjectID] || grade.subjectID}</td>
                        
                        {/* Prelim */}
                        <td className="px-4 py-3 text-center">
                          {editingGradeId === grade.id ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editingGrades[grade.id]?.prelim ?? grade.prelim}
                              onChange={(e) =>
                                setEditingGrades((prev) => ({
                                  ...prev,
                                  [grade.id]: {
                                    ...prev[grade.id],
                                    prelim: parseFloat(e.target.value) || 0
                                  }
                                }))
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          ) : (
                            <span>{grade.prelim.toFixed(2)}</span>
                          )}
                        </td>

                        {/* Midterm */}
                        <td className="px-4 py-3 text-center">
                          {editingGradeId === grade.id ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editingGrades[grade.id]?.midterm ?? grade.midterm}
                              onChange={(e) =>
                                setEditingGrades((prev) => ({
                                  ...prev,
                                  [grade.id]: {
                                    ...prev[grade.id],
                                    midterm: parseFloat(e.target.value) || 0
                                  }
                                }))
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          ) : (
                            <span>{grade.midterm.toFixed(2)}</span>
                          )}
                        </td>

                        {/* Finals */}
                        <td className="px-4 py-3 text-center">
                          {editingGradeId === grade.id ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={editingGrades[grade.id]?.finals ?? grade.finals}
                              onChange={(e) =>
                                setEditingGrades((prev) => ({
                                  ...prev,
                                  [grade.id]: {
                                    ...prev[grade.id],
                                    finals: parseFloat(e.target.value) || 0
                                  }
                                }))
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                            />
                          ) : (
                            <span>{grade.finals.toFixed(2)}</span>
                          )}
                        </td>

                        {/* Final Grade (Auto-calculated) */}
                        <td className="px-4 py-3 text-center font-semibold">
                          {editingGradeId === grade.id ? (
                            <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-900 text-xs font-medium">
                              {calculateFinalGrade(
                                editingGrades[grade.id]?.prelim ?? grade.prelim,
                                editingGrades[grade.id]?.midterm ?? grade.midterm,
                                editingGrades[grade.id]?.finals ?? grade.finals
                              ).toFixed(2)}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-blue-50 text-blue-900">
                              {grade.finalGrade.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Remarks */}
                        <td className="px-4 py-3">
                          {editingGradeId === grade.id ? (
                            <input
                              type="text"
                              value={editingRemarks[grade.id] ?? grade.remarks}
                              onChange={(e) =>
                                setEditingRemarks((prev) => ({
                                  ...prev,
                                  [grade.id]: e.target.value
                                }))
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Enter remarks..."
                            />
                          ) : (
                            <span className="text-gray-600">{grade.remarks || "—"}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          {editingGradeId === grade.id ? (
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleUpdateGrades(grade.id)}
                                disabled={isSaving}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 font-medium transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGradeId(null);
                                  setEditingGrades((prev) => {
                                    const newState = { ...prev };
                                    delete newState[grade.id];
                                    return newState;
                                  });
                                  setEditingRemarks((prev) => {
                                    const newState = { ...prev };
                                    delete newState[grade.id];
                                    return newState;
                                  });
                                }}
                                disabled={isSaving}
                                className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingGradeId(grade.id);
                                setEditingGrades((prev) => ({
                                  ...prev,
                                  [grade.id]: {
                                    prelim: grade.prelim,
                                    midterm: grade.midterm,
                                    finals: grade.finals
                                  }
                                }));
                                setEditingRemarks((prev) => ({
                                  ...prev,
                                  [grade.id]: grade.remarks
                                }));
                              }}
                              className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grade Summary */}
            {getFilteredGrades().length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total Grades</p>
                  <p className="text-lg font-bold text-gray-900">{getFilteredGrades().length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Avg Final Grade</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {(
                      getFilteredGrades().reduce((sum, g) => sum + g.finalGrade, 0) /
                      getFilteredGrades().length
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Highest Grade</p>
                  <p className="text-lg font-bold text-green-600">
                    {Math.max(...getFilteredGrades().map((g) => g.finalGrade)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Lowest Grade</p>
                  <p className="text-lg font-bold text-red-600">
                    {Math.min(...getFilteredGrades().map((g) => g.finalGrade)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}