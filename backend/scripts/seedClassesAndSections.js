require('dotenv').config();
const { query } = require('../config/database');

async function seedClassesAndSections() {
    try {
        console.log('Starting to seed classes and sections...');

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;

        // Define classes to create
        const classes = [
            { name: 'Class 1', year: academicYear },
            { name: 'Class 2', year: academicYear },
            { name: 'Class 3', year: academicYear },
            { name: 'Class 4', year: academicYear },
            { name: 'Class 5', year: academicYear },
            { name: 'Class 6', year: academicYear },
            { name: 'Class 7', year: academicYear },
            { name: 'Class 8', year: academicYear },
            { name: 'Class 9', year: academicYear },
            { name: 'Class 10', year: academicYear },
            { name: 'Class 11', year: academicYear },
            { name: 'Class 12', year: academicYear }
        ];

        // Define sections
        const sectionNames = ['A', 'B', 'C', 'D'];

        // Insert classes and sections
        for (const cls of classes) {
            // Check if class already exists
            const existingClass = await query(
                'SELECT id FROM classes WHERE class_name = $1 AND academic_year = $2',
                [cls.name, cls.year]
            );

            let classId;

            if (existingClass.length > 0) {
                classId = existingClass[0].id;
                console.log(`Class "${cls.name}" already exists (ID: ${classId})`);
            } else {
                // Insert class
                const result = await query(
                    `INSERT INTO classes (class_name, academic_year, is_active) 
                     VALUES ($1, $2, TRUE) 
                     RETURNING id`,
                    [cls.name, cls.year]
                );
                classId = result[0].id;
                console.log(`Created class "${cls.name}" (ID: ${classId})`);
            }

            // Insert sections for this class
            for (const sectionName of sectionNames) {
                // Check if section already exists
                const existingSection = await query(
                    'SELECT id FROM sections WHERE class_id = $1 AND section_name = $2',
                    [classId, sectionName]
                );

                if (existingSection.length > 0) {
                    console.log(`  Section "${sectionName}" already exists for ${cls.name}`);
                } else {
                    await query(
                        `INSERT INTO sections (class_id, section_name, max_students, room_number) 
                         VALUES ($1, $2, 40, $3)`,
                        [classId, sectionName, `${cls.name.replace('Class ', '')}-${sectionName}`]
                    );
                    console.log(`  Created section "${sectionName}" for ${cls.name}`);
                }
            }
        }

        console.log('\n✅ Successfully seeded classes and sections!');
        console.log(`Academic Year: ${academicYear}`);
        console.log(`Classes: ${classes.length}`);
        console.log(`Sections per class: ${sectionNames.length}`);
        console.log(`Total sections: ${classes.length * sectionNames.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding classes and sections:', error);
        process.exit(1);
    }
}

seedClassesAndSections();
