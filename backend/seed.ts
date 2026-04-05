import pool from './db/connection';
import { createUser } from './service/usersService';
import { createCourse } from './service/courseService';
import { createSubject } from './service/subjectsService';
import { createStudent } from './service/studentsService';
import { createPrerequisite } from './service/subjectPrerequisitesService';
import { createGrade } from './service/gradesService';

const ADMIN_CREDENTIALS = {
  email: 'admin@schoolsystem.com',
  password: 'AdminSecure2024!',
  role: 'admin'
};

async function seed() {
  try {
    console.log('Starting seed data...');

    // 1. CREATE ADMIN USER
    console.log('\n1. Creating admin user...');
    const admin = await createUser(ADMIN_CREDENTIALS);
    console.log(`✓ Admin user created: ${ADMIN_CREDENTIALS.email}`);
    console.log(`  Password: ${ADMIN_CREDENTIALS.password}`);

    // 2. CREATE COURSES (4 courses)
    console.log('\n2. Creating courses...');
    const courses = await Promise.all([
      createCourse('CS', 'Computer Science', 'CS degree program'),
      createCourse('ENG', 'Engineering', 'Engineering degree program'),
      createCourse('BUS', 'Business Administration', 'Business degree program'),
      createCourse('ARTS', 'Arts & Humanities', 'Arts degree program')
    ]);
    console.log(`✓ Created ${courses.length} courses`);
    const [csCourse, engCourse, busCourse, artsCourse] = courses;

    // GENERAL EDUCATION SUBJECTS (Available to all courses - Philippine Standard)
    const generalEdSubjects = [
      { code: 'CHI1', title: 'Constitutional History 1', units: 3 },
      { code: 'CHI2', title: 'Constitutional History 2', units: 3 },
      { code: 'RIZAL', title: 'Works & Life of Jose Rizal', units: 3 },
      { code: 'STS', title: 'Science, Technology and Society', units: 3 },
      { code: 'ENG101', title: 'English Composition', units: 3 },
      { code: 'FIL101', title: 'Filipino Language', units: 3 },
      { code: 'PHILO101', title: 'Philosophy and Ethics', units: 3 },
      { code: 'MATH101', title: 'General Mathematics', units: 4 }
    ];

    // 3. CREATE SUBJECTS (12 course-specific + 8 general ed per course = 40 total)
    console.log('\n3. Creating subjects...');
    const subjects = [];
    const coursesList = [csCourse, engCourse, busCourse, artsCourse];
    const courseSpecificSubjects = {
      [csCourse.id]: [
        { code: 'CS101', title: 'Introduction to Programming', units: 3 },
        { code: 'CS201', title: 'Data Structures', units: 4 },
        { code: 'CS301', title: 'Algorithms', units: 4 }
      ],
      [engCourse.id]: [
        { code: 'ENG101', title: 'Basic Engineering', units: 3 },
        { code: 'ENG201', title: 'Mechanics I', units: 4 },
        { code: 'ENG202', title: 'Electronics Basics', units: 3 }
      ],
      [busCourse.id]: [
        { code: 'BUS101', title: 'Business Fundamentals', units: 3 },
        { code: 'BUS201', title: 'Accounting I', units: 4 },
        { code: 'BUS301', title: 'Advanced Finance', units: 4 }
      ],
      [artsCourse.id]: [
        { code: 'ARTS101', title: 'Art History', units: 3 },
        { code: 'ARTS201', title: 'Literature Classics', units: 3 },
        { code: 'ARTS202', title: 'World Cultures', units: 3 }
      ]
    };

    // Create course-specific subjects
    for (const course of coursesList) {
      const courseSubjects = courseSpecificSubjects[course.id];
      for (const subj of courseSubjects) {
        const created = await createSubject({
          courseID: course.id,
          code: subj.code,
          title: subj.title,
          units: subj.units
        });
        subjects.push(created);
      }
    }

    // Create general education subjects for all courses
    const genEdByCode: Record<string, any[]> = {};
    for (const course of coursesList) {
      for (const genEd of generalEdSubjects) {
        const created = await createSubject({
          courseID: course.id,
          code: `${course.code}-${genEd.code}`,
          title: genEd.title,
          units: genEd.units
        });
        if (!genEdByCode[genEd.code]) {
          genEdByCode[genEd.code] = [];
        }
        genEdByCode[genEd.code].push(created);
        subjects.push(created);
      }
    }

    console.log(`✓ Created ${subjects.length} subjects (${coursesList.length * 3} course-specific + ${coursesList.length * generalEdSubjects.length} general education)`);

    // 4. CREATE PREREQUISITES (6+ links)
    console.log('\n4. Creating subject prerequisites...');
    const prerequisites = [
      // CS prerequisites
      { subjectID: subjects[1].id, prerequisiteSubjectID: subjects[0].id }, // CS201 requires CS101
      { subjectID: subjects[2].id, prerequisiteSubjectID: subjects[1].id }, // CS301 requires CS201
      
      // ENG prerequisites
      { subjectID: subjects[5].id, prerequisiteSubjectID: subjects[3].id }, // ENG202 requires ENG101
      { subjectID: subjects[4].id, prerequisiteSubjectID: subjects[3].id }, // ENG201 requires ENG101
      
      // BUS prerequisites
      { subjectID: subjects[8].id, prerequisiteSubjectID: subjects[7].id }, // BUS301 requires BUS201
      { subjectID: subjects[7].id, prerequisiteSubjectID: subjects[6].id }, // BUS201 requires BUS101

      // ARTS prerequisites
      { subjectID: subjects[11].id, prerequisiteSubjectID: subjects[9].id }, // ARTS201 requires ARTS101
      { subjectID: subjects[12].id, prerequisiteSubjectID: subjects[9].id }, // ARTS202 requires ARTS101
      
      // General education prerequisite (CHI2 requires CHI1)
      { subjectID: genEdByCode['CHI2'][0].id, prerequisiteSubjectID: genEdByCode['CHI1'][0].id }
    ];

    for (const prereq of prerequisites) {
      try {
        await createPrerequisite(prereq);
      } catch (error) {
        console.warn(`  ⚠ Prerequisite skipped (may already exist or invalid): ${error}`);
      }
    }
    console.log(`✓ Created prerequisite links`);

    // 5. CREATE STUDENTS (50 students distributed across courses)
    console.log('\n5. Creating students...');
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'Robert', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'William', 'Isabella', 'Benjamin', 'Mia', 'Daniel', 'Charlotte', 'Joseph', 'Amelia', 'Thomas', 'Harper'];
    const lastNames = ['Santos', 'Garcia', 'Reyes', 'Cruz', 'Fernandez', 'Dela Cruz', 'Lopez', 'Gonzales', 'Rodriguez', 'Martinez', 'Hernandez', 'Pena', 'Ramos', 'Torres', 'Morales', 'Jimenez', 'Romero', 'Villar', 'Simon', 'Mercado'];

    const courseIds = coursesList.map(c => c.id);
    const students = [];

    for (let i = 1; i <= 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];

      const student = await createStudent({
        studentNumber: `STU${String(i).padStart(5, '0')}`,
        firstName,
        lastName,
        email: `student${i}@schoolsystem.edu.ph`,
        birthDate: new Date(`${1998 + Math.floor(Math.random() * 5)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`),
        courseId
      });
      students.push(student);
    }
    console.log(`✓ Created ${students.length} students`);

    // 6. CREATE GRADES FOR STUDENTS
    console.log('\n6. Creating grades for students...');

    // Define valid grade values (1.00 is highest, 3.00 is lowest, 5.00 is failed)
    const validGrades = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00];
    
    // Helper function to generate random grade from valid grades
    const randomGrade = () => validGrades[Math.floor(Math.random() * validGrades.length)];
    
    // For each student, create grades for their enrolled subjects
    let gradeCount = 0;
    for (const student of students) {
      // Get subjects for this student's course
      const courseSubjects = subjects.filter(s => s.courseID === student.courseId && s.code.includes('101'));
      
      // Create grades for each subject
      for (const subject of courseSubjects) {
        try {
          // Generate random grades
          const prelim = randomGrade();
          const midterm = randomGrade();
          const finals = randomGrade();
          
          // Calculate final grade as average rounded to nearest 0.25
          const average = (prelim + midterm + finals) / 3;
          const finalGrade = Math.round(average * 4) / 4;
          
          await createGrade({
            studentID: student.id,
            subjectID: subject.id,
            courseID: student.courseId,
            prelim,
            midterm,
            finals,
            finalGrade,
            remarks: '', // Empty remarks as user will fill this later
            encodedByUserID: admin.id
          });
          gradeCount++;
        } catch (error) {
          console.warn(`  ⚠ Grade creation skipped for student ${student.id}, subject ${subject.id}`);
        }
      }
    }
    console.log(`✓ Created ${gradeCount} grade records`);

    console.log('\n✅ Seed data completed successfully!');
    console.log(`\n--- GRADING SUMMARY ---`);
    console.log(`  • 50 students created`);
    console.log(`  • ${subjects.length} subjects total`);
    console.log(`  • ${gradeCount} grade records created`);
    console.log(`  • Grade range: 1.00 (highest) to 3.00 (lowest), 5.00 (failed)`);
    console.log('------------------------');
    console.log('\n--- GENERAL EDUCATION SUBJECTS (Available to all courses) ---');
    generalEdSubjects.forEach(s => {
      console.log(`  • ${s.code}: ${s.title} (${s.units} units)`);
    });
    console.log('-------------------------------------------------------------');
    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log(`Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`Password: ${ADMIN_CREDENTIALS.password}`);
    console.log(`Role: ${ADMIN_CREDENTIALS.role}`);
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();