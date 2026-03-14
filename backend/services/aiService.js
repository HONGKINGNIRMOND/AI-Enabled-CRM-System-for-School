const { query } = require('../config/database');

/**
 * AI Service for Predictive Analytics
 * Uses heuristic-based models to predict attendance and performance trends.
 */
class AIService {

    /**
     * Predict Attendance Drops
     * Identifies students with declining attendance trends.
     */
    async predictAttendanceDrops() {
        try {
            const currentYear = process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

            // First, try to get data from attendance_summary
            let summaryData = [];
            try {
                summaryData = await this.getAttendanceFromSummary(currentYear);
            } catch (summaryErr) {
                console.warn('attendance_summary table not available, falling back to raw data:', summaryErr.message);
            }

            if (summaryData.length > 0) {
                return this.analyzeAttendanceTrends(summaryData);
            }

            // Fallback: Calculate from raw attendance data
            return await this.calculateAttendanceFromRaw(currentYear);

        } catch (error) {
            console.error('AI Attendance Prediction Error:', error);
            throw error;
        }
    }

    /**
     * Get attendance data from summary table
     */
    async getAttendanceFromSummary(currentYear) {
        const sql = `
            SELECT 
                s.id, se.roll_number, s.first_name, s.last_name,
                c.class_name, sec.section_name,
                asm.month, asm.attendance_percentage,
                asm.present_days, asm.total_days
            FROM students s
            JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
            JOIN classes c ON se.class_id = c.id
            JOIN sections sec ON se.section_id = sec.id
            JOIN attendance_summary asm ON s.id = asm.student_id
            WHERE asm.academic_year = $1
            ORDER BY s.id, asm.month DESC
        `;
        return await query(sql, [currentYear]);
    }

    /**
     * Calculate attendance from raw attendance records
     */
    async calculateAttendanceFromRaw(currentYear) {
        const sql = `
            WITH monthly_attendance AS (
                SELECT 
                    s.id,
                    s.first_name,
                    s.last_name,
                    se.roll_number,
                    c.class_name,
                    sec.section_name,
                    EXTRACT(MONTH FROM a.attendance_date) as month,
                    COUNT(*) as total_days,
                    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
                    ROUND(
                        (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
                        2
                    ) as attendance_percentage
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
                JOIN classes c ON se.class_id = c.id
                JOIN sections sec ON se.section_id = sec.id
                LEFT JOIN attendance a ON s.id = a.student_id 
                    AND a.attendance_date >= NOW() - INTERVAL '90 days'
                WHERE a.id IS NOT NULL
                GROUP BY s.id, s.first_name, s.last_name, se.roll_number, 
                         c.class_name, sec.section_name, EXTRACT(MONTH FROM a.attendance_date)
            )
            SELECT * FROM monthly_attendance
            ORDER BY id, month DESC
        `;

        const data = await query(sql, []);
        return this.analyzeAttendanceTrends(data);
    }

    /**
     * Analyze attendance trends and identify at-risk students
     */
    analyzeAttendanceTrends(data) {
        const students = {};

        data.forEach(row => {
            if (!students[row.id]) {
                students[row.id] = {
                    info: row,
                    history: []
                };
            }
            students[row.id].history.push({
                month: row.month,
                percentage: parseFloat(row.attendance_percentage || 0),
                present: parseInt(row.present_days || 0),
                total: parseInt(row.total_days || 0)
            });
        });

        const atRiskStudents = [];

        for (const id in students) {
            const history = students[id].history;

            if (history.length === 0) continue;

            const current = history[0].percentage;
            const totalDays = history.reduce((sum, h) => sum + h.total, 0);

            // Skip if insufficient data
            if (totalDays < 5) continue;

            let riskLevel = null;
            let reason = '';
            let drop = 0;

            // Check for attendance drop
            if (history.length >= 2) {
                const previous = history[1].percentage;
                drop = previous - current;

                if (drop > 15) {
                    riskLevel = 'High';
                    reason = 'Significant attendance drop';
                } else if (drop > 10) {
                    riskLevel = 'Medium';
                    reason = 'Noticeable attendance decline';
                }
            }

            // Check for critically low attendance
            if (current < 60) {
                riskLevel = 'High';
                reason = 'Critically low attendance';
            } else if (current < 75 && !riskLevel) {
                riskLevel = 'Medium';
                reason = 'Below minimum attendance threshold';
            }

            // Check for declining trend over 3 months
            if (history.length >= 3 && !riskLevel) {
                const trend = this.calculateTrend(history.slice(0, 3));
                if (trend < -5) {
                    riskLevel = 'Medium';
                    reason = 'Consistent declining trend';
                }
            }

            if (riskLevel) {
                atRiskStudents.push({
                    student_id: students[id].info.id,
                    roll_number: students[id].info.roll_number,
                    name: `${students[id].info.first_name} ${students[id].info.last_name}`,
                    class: `${students[id].info.class_name}-${students[id].info.section_name}`,
                    current_attendance: current.toFixed(2),
                    previous_attendance: history.length >= 2 ? history[1].percentage.toFixed(2) : current.toFixed(2),
                    drop_percentage: drop.toFixed(2),
                    risk_level: riskLevel,
                    reason: reason,
                    total_days_tracked: totalDays
                });
            }
        }

        // Sort by risk level (High first) and then by attendance percentage (lowest first)
        atRiskStudents.sort((a, b) => {
            if (a.risk_level === 'High' && b.risk_level !== 'High') return -1;
            if (a.risk_level !== 'High' && b.risk_level === 'High') return 1;
            return parseFloat(a.current_attendance) - parseFloat(b.current_attendance);
        });

        return atRiskStudents;
    }

    /**
     * Calculate trend from attendance history
     */
    calculateTrend(history) {
        if (history.length < 2) return 0;

        const first = history[history.length - 1].percentage;
        const last = history[0].percentage;
        return last - first;
    }

    /**
     * Analyze Student Performance
     * Detailed performance analysis based on marks.
     */
    async analyzeStudentPerformance(studentId) {
        try {
            const currentYear = process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

            // Get marks data
            const marksSql = `
                SELECT 
                    sub.subject_name,
                    m.marks_obtained, 
                    m.max_marks,
                    et.exam_name,
                    m.created_at as exam_date
                FROM internal_marks m
                JOIN class_subjects cs ON m.class_subject_id = cs.id
                JOIN subjects sub ON cs.subject_id = sub.id
                JOIN exam_types et ON m.exam_type_id = et.id
                WHERE m.student_id = $1 AND m.academic_year = $2
                ORDER BY sub.subject_name, m.created_at DESC
            `;

            const marks = await query(marksSql, [studentId, currentYear]);

            // Get attendance data
            const attendanceSql = `
                SELECT 
                    COUNT(*) as total_days,
                    SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
                    ROUND(
                        (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
                        2
                    ) as attendance_percentage
                FROM attendance
                WHERE student_id = $1 
                    AND attendance_date >= NOW() - INTERVAL '90 days'
            `;

            const attendance = await query(attendanceSql, [studentId]);

            // Get student info
            const studentSql = `
                SELECT 
                    s.first_name, s.last_name, se.roll_number,
                    c.class_name, sec.section_name
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
                JOIN classes c ON se.class_id = c.id
                JOIN sections sec ON se.section_id = sec.id
                WHERE s.id = $1
            `;

            const studentInfo = await query(studentSql, [studentId]);

            // Analyze marks by subject
            const subjectAnalysis = {};
            const insights = [];
            const recommendations = [];

            marks.forEach(row => {
                const percentage = (row.marks_obtained / row.max_marks) * 100;
                if (!subjectAnalysis[row.subject_name]) {
                    subjectAnalysis[row.subject_name] = {
                        scores: [],
                        exams: [],
                        average: 0,
                        trend: 'stable',
                        status: 'good'
                    };
                }
                subjectAnalysis[row.subject_name].scores.push(percentage);
                subjectAnalysis[row.subject_name].exams.push({
                    name: row.exam_name,
                    score: percentage.toFixed(2),
                    marks: `${row.marks_obtained}/${row.max_marks}`
                });
            });

            // Calculate averages and trends
            for (const subject in subjectAnalysis) {
                const scores = subjectAnalysis[subject].scores;
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                subjectAnalysis[subject].average = avg.toFixed(2);

                // Determine trend
                if (scores.length >= 2) {
                    const recent = scores[0];
                    const previous = scores[1];
                    const change = recent - previous;

                    if (change > 5) {
                        subjectAnalysis[subject].trend = 'improving';
                    } else if (change < -5) {
                        subjectAnalysis[subject].trend = 'declining';
                    }
                }

                // Determine status
                if (avg >= 90) {
                    subjectAnalysis[subject].status = 'excellent';
                    insights.push(`🌟 Excellent performance in ${subject} (${avg.toFixed(1)}%)`);
                } else if (avg >= 75) {
                    subjectAnalysis[subject].status = 'good';
                } else if (avg >= 60) {
                    subjectAnalysis[subject].status = 'average';
                    recommendations.push(`📚 Focus on improving ${subject} - currently at ${avg.toFixed(1)}%`);
                } else if (avg >= 40) {
                    subjectAnalysis[subject].status = 'needs_improvement';
                    recommendations.push(`⚠️ ${subject} needs immediate attention - currently at ${avg.toFixed(1)}%`);
                } else {
                    subjectAnalysis[subject].status = 'critical';
                    recommendations.push(`🚨 Critical: ${subject} requires urgent intervention - currently at ${avg.toFixed(1)}%`);
                }

                // Trend insights
                if (subjectAnalysis[subject].trend === 'declining') {
                    insights.push(`📉 ${subject} showing declining trend - early intervention recommended`);
                } else if (subjectAnalysis[subject].trend === 'improving') {
                    insights.push(`📈 ${subject} showing improvement - keep up the good work!`);
                }
            }

            // Overall performance
            const allScores = Object.values(subjectAnalysis).flatMap(s => s.scores);
            const overallAverage = allScores.length > 0
                ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
                : 0;

            // Attendance insights
            const attendanceData = attendance[0] || { attendance_percentage: 0, total_days: 0 };
            if (attendanceData.attendance_percentage < 75) {
                insights.push(`⚠️ Attendance is below 75% (${attendanceData.attendance_percentage}%) - may affect academic performance`);
                recommendations.push('Improve attendance to enhance learning outcomes');
            } else if (attendanceData.attendance_percentage >= 90) {
                insights.push(`✅ Excellent attendance record (${attendanceData.attendance_percentage}%)`);
            }

            return {
                studentId,
                studentInfo: studentInfo[0] || {},
                overallAverage,
                attendance: {
                    percentage: attendanceData.attendance_percentage,
                    present: attendanceData.present_days,
                    total: attendanceData.total_days
                },
                subjectAnalysis,
                insights,
                recommendations,
                summary: this.generatePerformanceSummary(overallAverage, attendanceData.attendance_percentage)
            };

        } catch (error) {
            console.error('AI Performance Analysis Error:', error);
            throw error;
        }
    }

    /**
     * Generate performance summary
     */
    generatePerformanceSummary(academicAvg, attendancePercentage) {
        const academic = parseFloat(academicAvg);
        const attendance = parseFloat(attendancePercentage);

        if (academic >= 85 && attendance >= 90) {
            return 'Outstanding student with excellent academic performance and attendance';
        } else if (academic >= 75 && attendance >= 80) {
            return 'Good overall performance with room for improvement';
        } else if (academic >= 60 && attendance >= 75) {
            return 'Average performance - consistent effort needed';
        } else if (academic < 60 || attendance < 75) {
            return 'Requires immediate attention and support';
        } else {
            return 'Performance needs monitoring';
        }
    }

    /**
     * Get overall AI insights for dashboard
     */
    async getOverallInsights() {
        try {
            const currentYear = process.env.CURRENT_ACADEMIC_YEAR || new Date().getFullYear().toString();

            // Get at-risk students
            const atRiskStudents = await this.predictAttendanceDrops();

            // Get overall attendance statistics
            const attendanceStatsSql = `
                SELECT 
                    COUNT(DISTINCT s.id) as total_students,
                    ROUND(AVG(
                        CASE 
                            WHEN a.status = 'present' THEN 100 
                            ELSE 0 
                        END
                    ), 2) as avg_attendance,
                    COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN s.id END) as students_absent_today
                FROM students s
                JOIN student_enrollments se ON s.id = se.student_id AND se.is_current = TRUE
                LEFT JOIN attendance a ON s.id = a.student_id 
                    AND a.attendance_date = CURRENT_DATE
            `;

            const attendanceStats = await query(attendanceStatsSql, []);

            // Get performance statistics
            const performanceStatsSql = `
                SELECT 
                    COUNT(DISTINCT m.student_id) as students_with_marks,
                    ROUND(AVG((m.marks_obtained::DECIMAL / NULLIF(m.max_marks, 0)) * 100), 2) as avg_performance,
                    COUNT(DISTINCT CASE 
                        WHEN (m.marks_obtained::DECIMAL / NULLIF(m.max_marks, 0)) * 100 < 40 
                        THEN m.student_id 
                    END) as students_below_40
                FROM internal_marks m
                WHERE m.academic_year = $1
                    AND m.created_at >= NOW() - INTERVAL '90 days'
            `;

            const performanceStats = await query(performanceStatsSql, [currentYear]);

            // Generate insights
            const insights = [];
            const alerts = [];

            // Attendance insights
            const highRiskCount = atRiskStudents.filter(s => s.risk_level === 'High').length;
            const mediumRiskCount = atRiskStudents.filter(s => s.risk_level === 'Medium').length;

            if (highRiskCount > 0) {
                alerts.push({
                    type: 'critical',
                    message: `${highRiskCount} student${highRiskCount > 1 ? 's' : ''} at high risk due to attendance issues`,
                    action: 'Immediate intervention required'
                });
            }

            if (mediumRiskCount > 0) {
                alerts.push({
                    type: 'warning',
                    message: `${mediumRiskCount} student${mediumRiskCount > 1 ? 's' : ''} showing declining attendance trends`,
                    action: 'Monitor closely and provide support'
                });
            }

            // Performance insights
            const perfStats = performanceStats[0] || {};
            if (perfStats.students_below_40 > 0) {
                alerts.push({
                    type: 'warning',
                    message: `${perfStats.students_below_40} student${perfStats.students_below_40 > 1 ? 's' : ''} scoring below 40%`,
                    action: 'Academic intervention needed'
                });
            }

            // Positive insights
            if (atRiskStudents.length === 0) {
                insights.push({
                    type: 'success',
                    message: 'All students maintaining good attendance',
                    icon: '✅'
                });
            }

            if (perfStats.avg_performance >= 75) {
                insights.push({
                    type: 'success',
                    message: `Strong overall academic performance (${perfStats.avg_performance}% average)`,
                    icon: '🎓'
                });
            }

            return {
                summary: {
                    totalStudents: attendanceStats[0]?.total_students || 0,
                    avgAttendance: attendanceStats[0]?.avg_attendance || 0,
                    studentsAbsentToday: attendanceStats[0]?.students_absent_today || 0,
                    avgPerformance: perfStats.avg_performance || 0,
                    atRiskCount: atRiskStudents.length,
                    highRiskCount,
                    mediumRiskCount
                },
                alerts,
                insights,
                atRiskStudents: atRiskStudents.slice(0, 5), // Top 5 at-risk students
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Get Overall Insights Error:', error);
            throw error;
        }
    }
}

module.exports = new AIService();
