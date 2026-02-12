const Student = require('./Student');
const Subject = require('./Subject');
const Mark = require('./Mark');
const Fee = require('./Fee');
const AuditLog = require('./AuditLog');
const User = require('./User');

// Define associations
Student.hasMany(Mark, { foreignKey: 'studentId', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Subject.hasMany(Mark, { foreignKey: 'subjectId', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

Student.hasMany(Fee, { foreignKey: 'studentId', as: 'fees', onDelete: 'CASCADE' });
Fee.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    Student,
    Subject,
    Mark,
    Fee,
    AuditLog
};
