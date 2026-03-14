# System Diagrams for School CRM System

This document contains various architectural and design diagrams for the School CRM System using Mermaid syntax.

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer"
        User[User Interface - React/Vite]
    end
    
    subgraph "Application Layer"
        API[API Gateway - Express.js]
        Auth[Authentication Service]
        StudentSvc[Student Management Service]
        AcademicSvc[Academic Services]
        NotificationSvc[Notification Service]
        AISvc[AI Analytics Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        Cache[(Redis Cache)]
        FileStore[(File Storage)]
    end
    
    subgraph "External Services"
        Email[Nodemailer - Email Service]
        SMS[Twilio - SMS/WhatsApp]
        Payment[Payment Gateway]
    end
    
    User --> API
    API --> Auth
    API --> StudentSvc
    API --> AcademicSvc
    API --> NotificationSvc
    API --> AISvc
    
    Auth --> DB
    StudentSvc --> DB
    AcademicSvc --> DB
    NotificationSvc --> DB
    AISvc --> DB
    
    NotificationSvc --> Email
    NotificationSvc --> SMS
    StudentSvc --> Payment
    
    DB --> Cache
    StudentSvc --> FileStore
```

## 2. Use Case Diagram

```mermaid
graph TD
    subgraph "Actors"
        Admin[Administrator]
        Teacher[Teacher]
        Student[Student]
    end
    
    subgraph "Use Cases"
        Login[Login to System]
        ManageUsers[Manage Users]
        ManageStudents[Manage Students]
        RecordAttendance[Record Attendance]
        EnterMarks[Enter Marks]
        ViewReports[View Reports]
        GenerateGrades[Generate Grades]
        SendNotifications[Send Notifications]
        ProcessFees[Process Fees]
        ViewPerformance[View Performance]
        UpdateProfile[Update Profile]
        ReceiveAlerts[Receive Alerts]
    end
    
    Admin --> Login
    Admin --> ManageUsers
    Admin --> ManageStudents
    Admin --> ViewReports
    Admin --> SendNotifications
    Admin --> ProcessFees
    
    Teacher --> Login
    Teacher --> RecordAttendance
    Teacher --> EnterMarks
    Teacher --> GenerateGrades
    Teacher --> ViewReports
    Teacher --> SendNotifications
    
    Student --> Login
    Student --> ViewPerformance
    Student --> UpdateProfile
    
    Login --> ManageUsers
    Login --> ManageStudents
    Login --> RecordAttendance
    Login --> EnterMarks
    Login --> ViewReports
    Login --> ViewPerformance
```

## 3. ER Diagram (Database)

```mermaid
erDiagram
    USERS ||--o{ STUDENTS : manages
    USERS ||--o{ CLASSES : teaches
    USERS ||--o{ MARKS : enters
    USERS ||--o{ ATTENDANCE : records
    USERS ||--o{ AUDIT_LOGS : creates
    
    ROLES ||--o{ USERS : has
    
    STUDENTS ||--o{ MARKS : receives
    STUDENTS ||--o{ ATTENDANCE : has
    STUDENTS ||--o{ FEES : pays
    STUDENTS ||--o{ INTERACTIONS : involved_in
    
    CLASSES ||--o{ STUDENTS : contains
    CLASSES ||--o{ SUBJECTS : offers
    CLASSES ||--o{ MARKS : has_grades_for
    
    SUBJECTS ||--o{ MARKS : graded_in
    
    LEADS ||--o{ INTERACTIONS : has
    LEADS ||--o{ STUDENTS : converts_to
    
    CUSTOMERS ||--o{ INTERACTIONS : communicates_with
    
    NOTIFICATIONS ||--o{ USERS : sent_to
    NOTIFICATIONS ||--o{ STUDENTS : sent_to
    
    USERS {
        int id PK
        string username
        string email
        string password_hash
        int role_id FK
        string full_name
        string phone
        boolean is_active
        datetime last_login
        datetime created_at
        datetime updated_at
    }
    
    ROLES {
        int id PK
        string role_name
        string description
        datetime created_at
        datetime updated_at
    }
    
    STUDENTS {
        int id PK
        string first_name
        string last_name
        date date_of_birth
        string gender
        int class_id FK
        string roll_number
        string parent_name
        string parent_phone
        string parent_email
        datetime enrollment_date
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    CLASSES {
        int id PK
        string class_name
        string academic_year
        string description
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    
    SUBJECTS {
        int id PK
        string subject_name
        string subject_code
        string description
        datetime created_at
        datetime updated_at
    }
    
    MARKS {
        int id PK
        int student_id FK
        int subject_id FK
        int class_id FK
        string exam_type
        decimal marks_obtained
        decimal total_marks
        string grade
        datetime exam_date
        datetime created_at
        datetime updated_at
    }
    
    ATTENDANCE {
        int id PK
        int student_id FK
        int class_id FK
        date attendance_date
        string status
        string remarks
        datetime created_at
        datetime updated_at
    }
    
    FEES {
        int id PK
        int student_id FK
        string fee_type
        decimal amount
        decimal paid_amount
        date due_date
        date payment_date
        string payment_status
        datetime created_at
        datetime updated_at
    }
    
    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string table_name
        int record_id
        json old_values
        json new_values
        datetime timestamp
    }
    
    LEADS {
        int id PK
        string name
        string email
        string phone
        string status
        string source
        datetime created_at
        datetime updated_at
    }
    
    INTERACTIONS {
        int id PK
        int lead_id FK
        int customer_id FK
        string interaction_type
        string notes
        datetime interaction_date
        datetime created_at
        datetime updated_at
    }
    
    CUSTOMERS {
        int id PK
        string name
        string email
        string phone
        string address
        datetime created_at
        datetime updated_at
    }
    
    NOTIFICATIONS {
        int id PK
        string recipient_type
        int recipient_id
        string channel
        string message
        string status
        datetime sent_at
        datetime created_at
        datetime updated_at
    }
```

## 4. DFD Diagram (Data Flow Diagram)

```mermaid
graph TD
    subgraph "External Entities"
        Admin[Administrator]
        Teacher[Teacher]
        Student[Student]
        PaymentSys[Payment System]
    end
    
    subgraph "Processes"
        P1[Authentication Process]
        P2[Student Management]
        P3[Academic Management]
        P4[Fee Processing]
        P5[Notification System]
        P6[Reporting System]
    end
    
    subgraph "Data Stores"
        DS1[(User Database)]
        DS2[(Student Database)]
        DS3[(Academic Database)]
        DS4[(Financial Database)]
        DS5[(Audit Database)]
    end
    
    Admin --> P1
    Teacher --> P1
    Student --> P1
   
    
    Admin --> P2
    P2 --> DS2
    P2 --> DS1
    
    Teacher --> P3
    P3 --> DS3
    P3 --> DS2
    
    Admin --> P4
    PaymentSys --> P4
    P4 --> DS4
    P4 --> DS2
    
    P5 --> DS1
    P5 --> DS2
    P5 --> DS3
    P5 --> DS4
    
    P6 --> DS1
    P6 --> DS2
    P6 --> DS3
    P6 --> DS4
    P6 --> DS5
    
    P2 --> P5
    P3 --> P5
    P4 --> P5

```

## 5. Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string password_hash
        +Role role
        +string full_name
        +string phone
        +boolean is_active
        +DateTime last_login
        +DateTime created_at
        +DateTime updated_at
        +login()
        +logout()
        +updateProfile()
    }
    
    class Role {
        +int id
        +string role_name
        +string description
        +DateTime created_at
        +DateTime updated_at
    }
    
    class Student {
        +int id
        +string first_name
        +string last_name
        +Date date_of_birth
        +string gender
        +Class class
        +string roll_number
        +string parent_name
        +string parent_phone
        +string parent_email
        +DateTime enrollment_date
        +boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +getMarks()
        +getAttendance()
        +updateProfile()
    }
    
    class Class {
        +int id
        +string class_name
        +string academic_year
        +string description
        +boolean is_active
        +DateTime created_at
        +DateTime updated_at
        +getStudents()
        +getSubjects()
    }
    
    class Subject {
        +int id
        +string subject_name
        +string subject_code
        +string description
        +DateTime created_at
        +DateTime updated_at
    }
    
    class Mark {
        +int id
        +Student student
        +Subject subject
        +Class class
        +string exam_type
        +decimal marks_obtained
        +decimal total_marks
        +string grade
        +DateTime exam_date
        +DateTime created_at
        +DateTime updated_at
        +calculateGrade()
    }
    
    class Attendance {
        +int id
        +Student student
        +Class class
        +Date attendance_date
        +string status
        +string remarks
        +DateTime created_at
        +DateTime updated_at
    }
    
    class Fee {
        +int id
        +Student student
        +string fee_type
        +decimal amount
        +decimal paid_amount
        +Date due_date
        +Date payment_date
        +string payment_status
        +DateTime created_at
        +DateTime updated_at
        +calculateBalance()
    }
    
    class AuditLog {
        +int id
        +User user
        +string action
        +string table_name
        +int record_id
        +JSON old_values
        +JSON new_values
        +DateTime timestamp
    }
    
    class NotificationService {
        +sendEmail()
        +sendSMS()
        +sendWhatsApp()
        +scheduleNotification()
    }
    
    class AIService {
        +analyzePerformance()
        +predictGrades()
        +generateInsights()
    }
    
    User ||--o{ Student : manages
    User ||--o{ Class : teaches
    User ||--o{ Mark : enters
    User ||--o{ Attendance : records
    User ||--o{ AuditLog : creates
    
    Role ||--o{ User : has
    
    Class ||--o{ Student : contains
    Class ||--o{ Subject : offers
    Class ||--o{ Mark : has_grades_for
    Class ||--o{ Attendance : has_attendance_for
    
    Student ||--o{ Mark : receives
    Student ||--o{ Attendance : has
    Student ||--o{ Fee : pays
    
    Subject ||--o{ Mark : graded_in
```

## 6. Sequence Diagram - Student Registration

```mermaid
sequenceDiagram
    participant U as User (Admin)
    participant F as Frontend
    participant A as Auth Service
    participant S as Student Service
    participant DB as Database
    participant N as Notification Service
    
    U->>F: Fill student registration form
    F->>A: POST /api/auth/verify (JWT)
    A-->>F: Token valid
    
    F->>S: POST /api/students (student data)
    S->>DB: INSERT INTO students
    DB-->>S: Student created
    
    S->>N: Trigger welcome notification
    N->>N: Send email/SMS to parent
    
    S-->>F: Success response
    F-->>U: Registration complete message
```

## 7. Sequence Diagram - Grade Entry

```mermaid
sequenceDiagram
    participant T as Teacher
    participant F as Frontend
    participant A as Auth Service
    participant M as Marks Service
    participant DB as Database
    participant G as Grade Calculator
    participant N as Notification Service
    
    T->>F: Enter marks for student
    F->>A: Verify JWT token
    A-->>F: Authorized
    
    F->>M: POST /api/marks (marks data)
    M->>DB: Validate student/subject exists
    DB-->>M: Validation passed
    
    M->>G: Calculate grade
    G-->>M: Grade calculated
    
    M->>DB: INSERT INTO marks
    DB-->>M: Marks recorded
    
    M->>N: Send performance alert
    N->>N: Notify parent if needed
    
    M-->>F: Success response
    F-->>T: Marks saved message
```

## 8. State Chart Diagram - Student Enrollment Status

```mermaid
stateDiagram-v2
    [*] --> Prospect: Lead identified
    Prospect --> Application: Application submitted
    Application --> Interview: Interview scheduled
    Interview --> Accepted: Admission granted
    Interview --> Rejected: Admission denied
    
    Accepted --> Enrolled: Fees paid & documents submitted
    Enrolled --> Active: Classes started
    Active --> Graduated: Academic year completed
    Active --> Withdrawn: Student withdrawn
    Active --> Transferred: Transferred to another school
    
    Rejected --> [*]
    Withdrawn --> [*]
    Transferred --> [*]
    Graduated --> [*]
    
    Prospect --> Lost: Lead lost
    Lost --> [*]
```

## 9. Activity Diagram - Student Admission Process

```mermaid
flowchart TD
    A[Lead Generation] --> B{Lead Qualification}
    B -->|Qualified| C[Application Form]
    B -->|Not Qualified| D[Lead Nurturing]
    
    C --> E[Document Verification]
    E --> F{Documents Valid?}
    F -->|Yes| G[Entrance Test/Interview]
    F -->|No| H[Request Additional Documents]
    H --> E
    
    G --> I{Admission Decision}
    I -->|Accepted| J[Fee Payment]
    I -->|Rejected| K[Send Rejection Notice]
    
    J --> L{Fees Paid?}
    L -->|Yes| M[Generate Admission Letter]
    L -->|No| N[Send Payment Reminder]
    N --> J
    
    M --> O[Student Registration]
    O --> P[Welcome Package]
    P --> Q[Class Assignment]
    Q --> R[Enrollment Complete]
    
    K --> S[End Process]
    D --> T{Lead Converted?}
    T -->|Yes| C
    T -->|No| S
```

## 10. Deployment Diagram

```mermaid
graph TD
    subgraph "User Devices"
        WebBrowser[Web Browser]
        MobileApp[Mobile App - Future]
    end
    
    subgraph "Load Balancer"
        LB[NGINX Load Balancer]
    end
    
    subgraph "Application Servers"
        AppServer1[Node.js App Server 1]
        AppServer2[Node.js App Server 2]
        AppServer3[Node.js App Server 3]
    end
    
    subgraph "Database Cluster"
        PrimaryDB[(PostgreSQL Primary)]
        ReplicaDB1[(PostgreSQL Replica 1)]
        ReplicaDB2[(PostgreSQL Replica 2)]
    end
    
    subgraph "Cache & Storage"
        Redis[(Redis Cache)]
        FileStorage[(File Storage - S3/Local)]
    end
    
    subgraph "External Services"
        EmailSvc[Email Service - SES/SMTP]
        SMSSvc[SMS Service - Twilio]
        AISvc[AI Service - OpenAI/Claude]
    end
    
    WebBrowser --> LB
    MobileApp --> LB
    
    LB --> AppServer1
    LB --> AppServer2
    LB --> AppServer3
    
    AppServer1 --> PrimaryDB
    AppServer2 --> PrimaryDB
    AppServer3 --> PrimaryDB
    
    PrimaryDB --> ReplicaDB1
    PrimaryDB --> ReplicaDB2
    
    AppServer1 --> Redis
    AppServer2 --> Redis
    AppServer3 --> Redis
    
    AppServer1 --> FileStorage
    AppServer2 --> FileStorage
    AppServer3 --> FileStorage
    
    AppServer1 --> EmailSvc
    AppServer2 --> EmailSvc
    AppServer3 --> EmailSvc
    
    AppServer1 --> SMSSvc
    AppServer2 --> SMSSvc
    AppServer3 --> SMSSvc
    
    AppServer1 --> AISvc
    AppServer2 --> AISvc
    AppServer3 --> AISvc
```

## 11. Interaction Diagram - Login Process

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthController
    participant UserModel
    participant JWTService
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>AuthController: POST /api/auth/login
    AuthController->>UserModel: findUserByEmail(email)
    UserModel->>Database: SELECT * FROM users WHERE email = ?
    Database-->>UserModel: User data
    UserModel-->>AuthController: User object
    
    AuthController->>AuthController: verifyPassword(password, hash)
    AuthController->>JWTService: generateToken(user)
    JWTService-->>AuthController: JWT token
    
    AuthController->>UserModel: updateLastLogin(user.id)
    UserModel->>Database: UPDATE users SET last_login = NOW()
    Database-->>UserModel: Update successful
    
    AuthController-->>Frontend: {token, user: {id, name, role}}
    Frontend-->>User: Login successful, redirect to dashboard
```

## 12. State Chart Diagram - Fee Payment Status

```mermaid
stateDiagram-v2
    [*] --> Pending: Fee created
    Pending --> Overdue: Due date passed
    Pending --> Paid: Payment received
    Overdue --> Paid: Payment received
    Paid --> [*]
    
    Overdue --> WrittenOff: Fee written off
    WrittenOff --> [*]
    
    Pending --> Cancelled: Fee cancelled
    Overdue --> Cancelled: Fee cancelled
    Cancelled --> [*]
```

## 13. Activity Diagram - Report Generation

```mermaid
flowchart TD
    A[User Requests Report] --> B{Report Type}
    B -->|Student Performance| C[Gather Student Data]
    B -->|Attendance Report| D[Gather Attendance Data]
    B -->|Financial Report| E[Gather Fee Data]
    B -->|Academic Summary| F[Gather Academic Data]
    
    C --> G{Data Filters Applied?}
    D --> G
    E --> G
    F --> G
    
    G -->|Yes| H[Apply Filters]
    G -->|No| I[Process Raw Data]
    H --> I
    
    I --> J{Export Format}
    J -->|PDF| K[Generate PDF]
    J -->|Excel| L[Generate Excel]
    J -->|CSV| M[Generate CSV]
    
    K --> N[Send to User]
    L --> N
    M --> N
    
    N --> O[Log Report Generation]
    O --> P[End Process]
```