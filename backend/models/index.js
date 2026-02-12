// Models temporarily disabled for JSON-based backend
// const User = require('./User');
// const Lead = require('./Lead');
// const Customer = require('./Customer');
// const Interaction = require('./Interaction');
// const CallRecord = require('./CallRecord');

// Define associations
// User.hasMany(CallRecord, { foreignKey: 'callerId', as: 'callsMade' });
// CallRecord.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });

// User.hasMany(Interaction, { foreignKey: 'userId', as: 'interactions' });
// Interaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Lead.hasMany(Interaction, { foreignKey: 'leadId', as: 'interactions' });
// Interaction.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

// Customer.hasMany(Interaction, { foreignKey: 'customerId', as: 'interactions' });
// Interaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Lead.hasMany(CallRecord, { foreignKey: 'calleeId', as: 'callsReceived' });
// CallRecord.belongsTo(Lead, { foreignKey: 'calleeId', as: 'calleeLead', constraints: false });

// Customer.hasMany(CallRecord, { foreignKey: 'calleeCustomerId', as: 'callsReceived' });
// CallRecord.belongsTo(Customer, { foreignKey: 'calleeCustomerId', as: 'calleeCustomer', constraints: false });

module.exports = {
    // User,
    // Lead,
    // Customer,
    // Interaction,
    // CallRecord
};