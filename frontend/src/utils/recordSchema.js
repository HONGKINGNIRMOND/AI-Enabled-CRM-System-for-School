/**
 * Shared schema for student and staff records
 * Maps UI-friendly field names to their data types and backend keys.
 */
export const sharedRecordSchema = {
    'Full Name': { type: 'string', key: 'name' },
    'Gender': { type: 'category', key: 'gender', options: ['Male', 'Female', 'Other'] },
    'Class': { type: 'category', key: 'class_id' },
    'Section': { type: 'category', key: 'section_id' },
    'Phone': { type: 'string', key: 'phone' },
    'Father Name': { type: 'string', key: 'father_name' },
    'Mother Name': { type: 'string', key: 'mother_name' },
    'Address': { type: 'string', key: 'address' },
    'City': { type: 'category', key: 'city', options: [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'
    ]},
    'State': { type: 'category', key: 'state', options: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
    ]},
    'Pincode': { type: 'string', key: 'pincode' },
    'Date of Birth': { type: 'date', key: 'date_of_birth' },
    'Admission Date': { type: 'date', key: 'admission_date' },
    'Joining Date': { type: 'date', key: 'joining_date' }
};

export const getFieldType = (fieldName) => sharedRecordSchema[fieldName]?.type || 'string';
export const getFieldKey = (fieldName) => sharedRecordSchema[fieldName]?.key || fieldName.toLowerCase().replace(/ /g, '_');
