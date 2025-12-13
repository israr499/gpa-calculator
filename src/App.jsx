import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import './App.css';

// Grading scheme data
const GRADING_SCHEME = [
  { min: 85, max: 100, grade: 'A', point: 4 },
  { min: 80, max: 84, grade: 'A-', point: 3.67 },
  { min: 75, max: 79, grade: 'B+', point: 3.33 },
  { min: 71, max: 74, grade: 'B', point: 3 },
  { min: 68, max: 70, grade: 'B-', point: 2.67 },
  { min: 64, max: 67, grade: 'C+', point: 2.33 },
  { min: 60, max: 63, grade: 'C', point: 2 },
  { min: 57, max: 59, grade: 'C-', point: 1.67 },
  { min: 53, max: 56, grade: 'D+', point: 1.33 },
  { min: 50, max: 52, grade: 'D', point: 1 },
  { min: 0, max: 49, grade: 'F', point: 0 }
];

function App() {
  const [step, setStep] = useState(1);

  // GPA State
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState(null);

  // CGPA State
  const [cgpaSemesters, setCgpaSemesters] = useState([]);
  const [cgpaResult, setCgpaResult] = useState(null);

  /* ================= FEATURE 2: LOCAL STORAGE ================= */
  // Load data on startup
  useEffect(() => {
    const savedData = localStorage.getItem('cgpaSemesters');
    if (savedData) {
      setCgpaSemesters(JSON.parse(savedData));
    }
  }, []);

  // Save data whenever cgpaSemesters changes
  useEffect(() => {
    localStorage.setItem('cgpaSemesters', JSON.stringify(cgpaSemesters));
  }, [cgpaSemesters]);

  const clearStorage = () => {
    if(window.confirm("Are you sure you want to clear all saved semester data?")) {
      localStorage.removeItem('cgpaSemesters');
      setCgpaSemesters([]);
      setCgpaResult(null);
    }
  };

  /* ================= FEATURE 3: PDF EXPORT ================= */
  const exportPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Academic Report", 20, 20);
    doc.setFontSize(12);

    if (type === 'GPA' && results) {
      doc.text(`Session GPA: ${results.gpa.toFixed(2)}`, 20, 40);
      doc.text(`Total Credits: ${results.totalCredit}`, 20, 50);
      doc.text("Course Breakdown:", 20, 70);
      
      let y = 80;
      results.processed.forEach((c, i) => {
        doc.text(`${i+1}. ${c.title} - Grade: ${c.grade} (${c.marks})`, 20, y);
        y += 10;
      });
    } else if (type === 'CGPA' && cgpaResult) {
      doc.text(`Cumulative GPA (CGPA): ${cgpaResult.cgpa.toFixed(2)}`, 20, 40);
      doc.text(`Total Semesters: ${cgpaSemesters.length}`, 20, 50);
      doc.text(`Total Credits: ${cgpaResult.totalCredits}`, 20, 60);
    }

    doc.save(`${type}_Result.pdf`);
  };

  /* ================= GPA LOGIC ================= */
  const addCourse = () =>
    setCourses([...courses, { title: '', credit: '', marks: '' }]);

  const handleChange = (i, field, value) => {
    // Logic to prevent negative values in GPA calculator
    if ((field === 'credit' || field === 'marks') && value < 0) return;
    const updated = [...courses];
    updated[i][field] = value;
    setCourses(updated);
  };

  const getGradeInfo = m =>
    GRADING_SCHEME.find(s => m >= s.min && m <= s.max) || {
      grade: 'F',
      point: 0
    };

  const handleCalculate = e => {
    e.preventDefault();
    const processed = courses.map((c, i) => {
      const credit = parseFloat(c.credit) || 0;
      const marks = parseFloat(c.marks) || 0;
      const { grade, point } = getGradeInfo(marks);
      return {
        ...c,
        credit,
        marks,
        grade,
        point,
        gpp: credit * point,
        index: i + 1
      };
    });

    const totalCredit = processed.reduce((s, c) => s + c.credit, 0);
    const totalGpp = processed.reduce((s, c) => s + c.gpp, 0);
    const gpa = totalCredit ? totalGpp / totalCredit : 0;

    setResults({ processed, totalCredit, totalGpp, gpa });
    setStep(4);
  };

  /* ================= FEATURE 1: AUTO-ADD GPA TO CGPA ================= */
  const transferToCgpa = () => {
    if (!results) return;
    setCgpaSemesters(prev => [
      ...prev,
      { gpa: results.gpa.toFixed(2), credit: results.totalCredit }
    ]);
    setStep(5); // Redirect to CGPA view
  };

  /* ================= CGPA LOGIC (FIXED) ================= */
  const addSemester = () =>
    setCgpaSemesters([...cgpaSemesters, { gpa: '', credit: '' }]);

  const handleCgpaChange = (i, field, value) => {
    // 🛑 FIX: Immediately block negative numbers in state
    if (value < 0) return;

    const updated = [...cgpaSemesters];
    updated[i][field] = value;
    setCgpaSemesters(updated);
  };

  const calculateCgpa = e => {
    e.preventDefault();
    let totalCredits = 0;
    let weighted = 0;

    cgpaSemesters.forEach(s => {
      const gpa = parseFloat(s.gpa) || 0;
      const credit = parseFloat(s.credit) || 0;
      totalCredits += credit;
      weighted += gpa * credit;
    });

    const cgpa = totalCredits ? weighted / totalCredits : 0;
    setCgpaResult({ cgpa, totalCredits });
  };

  return (
    <div className="app-container">
      {/* HOME */}
      {step === 1 && (
        <div className="landing">
          <h1>GPA / CGPA Calculator</h1>
          <button className="primary-button" onClick={() => setStep(2)}>
            Calculate GPA 
          </button>
          <button
            className="primary-button"
            style={{ marginTop: 10 }}
            onClick={() => setStep(5)}
          >
            Calculate CGPA 
          </button>
        </div>
      )}

      {/* GRADING SCHEME */}
      {step === 2 && (
        <div className="scheme-view">
          <h1>Grading Scheme</h1>
          <table className="scheme-table">
            <thead>
              <tr>
                <th>Marks</th>
                <th>Grade</th>
                <th>Point</th>
              </tr>
            </thead>
            <tbody>
              {GRADING_SCHEME.map((s, i) => (
                <tr key={i}>
                  <td>{s.min} - {s.max}</td>
                  <td>{s.grade}</td>
                  <td>{s.point.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="primary-button" onClick={() => setStep(3)}>
            Start Calculation
          </button>
        </div>
      )}

      {/* GPA INPUT */}
      {step === 3 && (
        <div className="calculator-view">
          <h1>GPA Calculator</h1>
          <button className="add-button" onClick={addCourse}>
            + Add Course
          </button>

          {courses.length > 0 && (
            <form onSubmit={handleCalculate} className="form-container">
              {courses.map((c, i) => (
                <div key={i} className="course-row">
                  <input
                    placeholder="Course Title"
                    value={c.title}
                    onChange={e => handleChange(i, 'title', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Credits"
                    value={c.credit}
                    onChange={e => handleChange(i, 'credit', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Marks"
                    value={c.marks}
                    onChange={e => handleChange(i, 'marks', e.target.value)}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="primary-button">
                Calculate Result
              </button>
            </form>
          )}
        </div>
      )}

      {/* GPA RESULT */}
      {step === 4 && results && (
        <div className="results-view">
          <h1>GPA Result</h1>
          <div className="result-card">
             <h2>{results.gpa.toFixed(2)}</h2>
             <p>GPA</p>
          </div>
          
          <div className="button-group">
            <button className="action-button success" onClick={transferToCgpa}>
              📥 Save to CGPA List
            </button>
            <button className="action-button" onClick={() => exportPDF('GPA')}>
              📄 Download PDF
            </button>
          </div>

          <button
            className="primary-button"
            style={{marginTop: '20px'}}
            onClick={() => {
              setCourses([]);
              setResults(null);
              setStep(1);
            }}
          >
            Back to Home
          </button>
        </div>
      )}

      {/* CGPA CALCULATOR (With Validation Fixes) */}
      {step === 5 && (
        <div className="calculator-view">
          <h1>CGPA Calculator</h1>
          
          <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
             <button className="add-button" onClick={addSemester}>
                + Add Semester
             </button>
             <button className="add-button delete" onClick={clearStorage}>
                🗑 Clear Data
             </button>
          </div>

          {cgpaSemesters.length === 0 && <p>No semesters added yet.</p>}

          {cgpaSemesters.length > 0 && (
            <form onSubmit={calculateCgpa} className="form-container">
              {cgpaSemesters.map((s, i) => (
                <div key={i} className="course-row">
                  <span style={{fontWeight:'bold', padding:'10px'}}>Sem {i+1}</span>
                  
                  {/* GPA Input: Allows decimals */}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    placeholder="GPA"
                    value={s.gpa}
                    onChange={e => handleCgpaChange(i, 'gpa', e.target.value)}
                    required
                  />
                  
                  {/* Credit Input: BLOCKS decimals and negatives */}
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Credits"
                    value={s.credit}
                    // 🛑 This blocks keys '.' and '-'
                    onKeyDown={(e) => {
                        if(e.key === '.' || e.key === '-') {
                            e.preventDefault();
                        }
                    }}
                    onChange={e => handleCgpaChange(i, 'credit', e.target.value)}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="primary-button">
                Calculate CGPA
              </button>
            </form>
          )}

          {cgpaResult && (
            <div className="summary">
              <h2>CGPA: {cgpaResult.cgpa.toFixed(2)}</h2>
              <p>Total Credits: {cgpaResult.totalCredits}</p>
              
              <button className="action-button" onClick={() => exportPDF('CGPA')}>
                📄 Download CGPA Report
              </button>
            </div>
          )}

          <button
            className="primary-button"
            style={{ marginTop: 20 }}
            onClick={() => {
              setCgpaResult(null);
              setStep(1);
            }}
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}

export default App;