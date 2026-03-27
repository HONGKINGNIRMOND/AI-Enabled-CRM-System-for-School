const User = require('./User');
const Role = require('./Role');
const Student = require('./Student');
const Subject = require('./Subject');
const Mark = require('./Mark');
const Fee = require('./Fee');
const AuditLog = require('./AuditLog');

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Add other associations if needed
Student.hasMany(Mark, { foreignKey: 'student_id', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Subject.hasMany(Mark, { foreignKey: 'subject_id', as: 'marks', onDelete: 'CASCADE' });
Mark.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

Student.hasMany(Fee, { foreignKey: 'student_id', as: 'fees', onDelete: 'CASCADE' });
Fee.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

module.exports = {
    User,
    Role,
    Student,
    Subject,
    Mark,
    Fee,
    AuditLog
};