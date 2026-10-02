const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  // Clean all tables
  await prisma.verificationToken.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.mealMenu.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostelSetting.deleteMany();
  await prisma.announcement.deleteMany();

  console.log('Creating Hostel Settings...');
  await prisma.hostelSetting.create({
    data: {
      id: 'default',
      hostelName: 'Abhishek Boys Hostel',
      tagline: 'Smart & Secure Private Boys Hostel Management System',
      address: 'Plot 42, Knowledge Park III, Near Engineering College, Greater Noida, UP - 201310',
      phone: '+91 98765 43210',
      email: 'contact@abhishekhostel.com',
      defaultMonthlyFee: 5000,
      feeDueDay: 5,
      currency: '₹',
      upiId: 'abhishekhostel@icici',
      bankAccount: 'Abhishek Boys Hostel A/C: 50200019283746, IFSC: ICIC0001042, ICICI Bank Knowledge Park Branch',
      rulesText: `1. Entry & Exit Timings: The hostel gate closes strictly at 10:00 PM. Late entry requires prior written permission from the Chief Warden.
2. Cleanliness: Keep your rooms, corridors, and washrooms clean. Do not stick posters on walls.
3. Visitors: Outside guests or female visitors are strictly prohibited inside resident rooms. They may meet in the visitor lounge until 7:00 PM.
4. Substance Prohibition: Consumption of alcohol, tobacco, smoking, or any narcotics is strictly prohibited with zero tolerance (immediate expulsion).
5. Quiet Hours: Maintain strict silence between 10:30 PM and 6:00 AM to allow students to study and rest.
6. Electrical Appliances: High-wattage heaters, induction stoves, and immersion rods are not permitted in rooms.
7. Fee Deadlines: Monthly hostel fees are due on or before the 5th of every month.
8. Vacating Notice: A minimum of 30 days prior written notice is mandatory before vacating the hostel to claim the security deposit.`,
    },
  });

  console.log('Creating System Users...');
  const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'AdminPassword@2026', 10);
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@abhishekhostel.com').toLowerCase();
  const adminPhone = process.env.ADMIN_PHONE || '+91 98765 43210';
  const adminName = process.env.ADMIN_NAME || 'Mahesh (Admin)';

  const adminUser = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: adminPhone,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      authProvider: 'credentials',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
  });

  console.log('Creating Rooms and Beds...');
  const roomsData = [
    { roomNumber: '101', floor: 1, totalBeds: 4, roomType: 'Standard Non-AC', amenities: 'Ceiling Fan, 4 Study Desks, 4 Steel Lockers, Attached Washroom, Wi-Fi' },
    { roomNumber: '102', floor: 1, totalBeds: 4, roomType: 'Standard Non-AC', amenities: 'Ceiling Fan, 4 Study Desks, 4 Steel Lockers, Attached Washroom, Wi-Fi' },
    { roomNumber: '103', floor: 1, totalBeds: 3, roomType: 'Deluxe Non-AC', amenities: 'Balcony View, 3 Study Desks, 3 Cupboards, Attached Washroom, Wi-Fi' },
    { roomNumber: '104', floor: 1, totalBeds: 2, roomType: 'Premium AC', amenities: 'Split 1.5T AC, Geyser, 2 Ergonomic Chairs, Balcony, Attached Washroom' },
    { roomNumber: '201', floor: 2, totalBeds: 4, roomType: 'Standard Non-AC', amenities: 'Ceiling Fan, 4 Study Desks, 4 Steel Lockers, Attached Washroom, Wi-Fi' },
    { roomNumber: '202', floor: 2, totalBeds: 4, roomType: 'Standard Non-AC', amenities: 'Ceiling Fan, 4 Study Desks, 4 Steel Lockers, Attached Washroom, Wi-Fi' },
    { roomNumber: '203', floor: 2, totalBeds: 3, roomType: 'Deluxe Non-AC', amenities: 'Quiet Corner, 3 Study Desks, 3 Cupboards, Attached Washroom, Wi-Fi' },
    { roomNumber: '204', floor: 2, totalBeds: 2, roomType: 'Premium AC', amenities: 'Split 1.5T AC, Geyser, 2 Ergonomic Chairs, Balcony, Attached Washroom' },
    { roomNumber: '301', floor: 3, totalBeds: 4, roomType: 'Standard Non-AC', amenities: 'Terrace Breeze, 4 Study Desks, 4 Lockers, Attached Washroom, Wi-Fi' },
    { roomNumber: '302', floor: 3, totalBeds: 3, roomType: 'Deluxe Non-AC', amenities: 'Balcony, 3 Study Desks, Attached Washroom, Wi-Fi' },
  ];

  const createdRooms = {};
  const createdBeds = {}; // key: `${roomNumber}-${bedNumber}`

  for (const r of roomsData) {
    const room = await prisma.room.create({
      data: {
        roomNumber: r.roomNumber,
        floor: r.floor,
        totalBeds: r.totalBeds,
        roomType: r.roomType,
        amenities: r.amenities,
      },
    });
    createdRooms[r.roomNumber] = room;

    for (let i = 1; i <= r.totalBeds; i++) {
      const bedNumber = `Bed ${i}`;
      const bed = await prisma.bed.create({
        data: {
          bedNumber: bedNumber,
          roomId: room.id,
          isOccupied: false,
        },
      });
      createdBeds[`${r.roomNumber}-${bedNumber}`] = bed;
    }
  }

  console.log('Creating Students and assigning beds...');
  const studentsList = [
    {
      studentId: 'ABH-2026-001',
      fullName: 'Ravi Kumar',
      phone: '+91 98112 34567',
      email: 'ravi.kumar@gmail.com',
      parentName: 'S. K. Kumar',
      parentPhone: '+91 94112 34567',
      collegeName: 'Galgotias College of Engg & Tech',
      course: 'B.Tech Computer Science',
      year: '3rd Year',
      roomNumber: '101',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-07-15'),
      address: 'House 14B, Civil Lines, Kanpur, UP',
      emergencyContact: '+91 94112 34567 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-002',
      fullName: 'Sai Teja',
      phone: '+91 98223 45678',
      email: 'sai.teja24@gmail.com',
      parentName: 'K. N. Rao',
      parentPhone: '+91 94223 45678',
      collegeName: 'Sharda University',
      course: 'B.Tech Information Technology',
      year: '2nd Year',
      roomNumber: '101',
      bedNumber: 'Bed 2',
      joiningDate: new Date('2026-08-01'),
      address: 'Plot 88, Madhapur, Hyderabad, Telangana',
      emergencyContact: '+91 94223 45678 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PENDING',
    },
    {
      studentId: 'ABH-2026-003',
      fullName: 'Rahul Verma',
      phone: '+91 98334 56789',
      email: 'rahul.verma@outlook.com',
      parentName: 'Deepak Verma',
      parentPhone: '+91 94334 56789',
      collegeName: 'Bennett University',
      course: 'B.Tech AI & Data Science',
      year: '2nd Year',
      roomNumber: '101',
      bedNumber: 'Bed 4',
      joiningDate: new Date('2026-08-10'),
      address: 'Flat 302, Sector 14, Chandigarh',
      emergencyContact: '+91 94334 56789 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-004',
      fullName: 'Arjun Reddy',
      phone: '+91 98445 67890',
      email: 'arjun.reddy@gmail.com',
      parentName: 'Ramesh Reddy',
      parentPhone: '+91 94445 67890',
      collegeName: 'Galgotias University',
      course: 'B.Tech Mechanical Engg',
      year: '4th Year',
      roomNumber: '102',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-06-01'),
      address: 'Street 4, Banjara Hills, Hyderabad',
      emergencyContact: '+91 94445 67890 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'OVERDUE',
    },
    {
      studentId: 'ABH-2026-005',
      fullName: 'Kiran Kumar',
      phone: '+91 98556 78901',
      email: 'kiran.k@gmail.com',
      parentName: 'Venkatesh Kumar',
      parentPhone: '+91 94556 78901',
      collegeName: 'Noida Institute of Engg & Tech',
      course: 'MCA',
      year: '1st Year',
      roomNumber: '102',
      bedNumber: 'Bed 2',
      joiningDate: new Date('2026-07-20'),
      address: '12th Cross, Indiranagar, Bengaluru, Karnataka',
      emergencyContact: '+91 94556 78901 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-006',
      fullName: 'Vivek Sharma',
      phone: '+91 98667 89012',
      email: 'vivek.sharma@yahoo.com',
      parentName: 'Anil Sharma',
      parentPhone: '+91 94667 89012',
      collegeName: 'Bennett University',
      course: 'B.Tech Electronics & Comm',
      year: '1st Year',
      roomNumber: '102',
      bedNumber: 'Bed 3',
      joiningDate: new Date('2026-09-01'),
      address: 'Sector 62, Noida, UP',
      emergencyContact: '+91 94667 89012 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PENDING',
    },
    {
      studentId: 'ABH-2026-007',
      fullName: 'Aditya Patil',
      phone: '+91 98778 90123',
      email: 'aditya.patil@gmail.com',
      parentName: 'Sanjay Patil',
      parentPhone: '+91 94778 90123',
      collegeName: 'Galgotias University',
      course: 'B.Com Honors',
      year: '2nd Year',
      roomNumber: '103',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-08-15'),
      address: 'Kothrud, Pune, Maharashtra',
      emergencyContact: '+91 94778 90123 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-008',
      fullName: 'Pranav Joshi',
      phone: '+91 98889 01234',
      email: 'pranav.joshi@gmail.com',
      parentName: 'Mahesh Joshi',
      parentPhone: '+91 94889 01234',
      collegeName: 'Sharda University',
      course: 'BBA Finance',
      year: '2nd Year',
      roomNumber: '103',
      bedNumber: 'Bed 2',
      joiningDate: new Date('2026-08-20'),
      address: 'Navrangpura, Ahmedabad, Gujarat',
      emergencyContact: '+91 94889 01234 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PARTIALLY_PAID',
    },
    {
      studentId: 'ABH-2026-009',
      fullName: 'Manish Gupta',
      phone: '+91 98990 12345',
      email: 'manish.gupta@gmail.com',
      parentName: 'Rajesh Gupta',
      parentPhone: '+91 94990 12345',
      collegeName: 'NIET Greater Noida',
      course: 'B.Tech CS (Data Science)',
      year: '3rd Year',
      roomNumber: '104',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-07-01'),
      address: 'Alambagh, Lucknow, UP',
      emergencyContact: '+91 94990 12345 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 6500,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-010',
      fullName: 'Rohit Sen',
      phone: '+91 99001 23456',
      email: 'rohit.sen@gmail.com',
      parentName: 'Subhash Sen',
      parentPhone: '+91 95001 23456',
      collegeName: 'NIET Greater Noida',
      course: 'B.Tech IT',
      year: '3rd Year',
      roomNumber: '104',
      bedNumber: 'Bed 2',
      joiningDate: new Date('2026-07-05'),
      address: 'Salt Lake, Sector V, Kolkata, WB',
      emergencyContact: '+91 95001 23456 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 6500,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-011',
      fullName: 'Deepak Yadav',
      phone: '+91 99112 34567',
      email: 'deepak.y@gmail.com',
      parentName: 'Jagdish Yadav',
      parentPhone: '+91 95112 34567',
      collegeName: 'Galgotias College',
      course: 'B.Tech Civil Engg',
      year: '1st Year',
      roomNumber: '201',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-09-10'),
      address: 'Raja Mandi, Agra, UP',
      emergencyContact: '+91 95112 34567 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PENDING',
    },
    {
      studentId: 'ABH-2026-012',
      fullName: 'Aniket Singh',
      phone: '+91 99223 45678',
      email: 'aniket.singh@gmail.com',
      parentName: 'Suraj Singh',
      parentPhone: '+91 95223 45678',
      collegeName: 'Bennett University',
      course: 'BA Journalism',
      year: '2nd Year',
      roomNumber: '201',
      bedNumber: 'Bed 2',
      joiningDate: new Date('2026-08-01'),
      address: 'Boring Road, Patna, Bihar',
      emergencyContact: '+91 95223 45678 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      status: 'ACTIVE',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
    {
      studentId: 'ABH-2026-013',
      fullName: 'Aman Tiwari',
      phone: '+91 99334 56789',
      email: 'aman.tiwari@gmail.com',
      parentName: 'R. K. Tiwari',
      parentPhone: '+91 95334 56789',
      collegeName: 'Sharda University',
      course: 'B.Pharmacy',
      year: '4th Year',
      roomNumber: '203',
      bedNumber: 'Bed 1',
      joiningDate: new Date('2026-05-10'),
      address: 'Lanka, Varanasi, UP',
      emergencyContact: '+91 95334 56789 (Father)',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      status: 'NOTICE_PERIOD',
      monthlyFee: 5000,
      feeStatus: 'PAID',
    },
  ];

  const createdStudents = [];

  for (const s of studentsList) {
    const room = createdRooms[s.roomNumber];
    const bed = createdBeds[`${s.roomNumber}-${s.bedNumber}`];

    const student = await prisma.student.create({
      data: {
        studentId: s.studentId,
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        collegeName: s.collegeName,
        course: s.course,
        year: s.year,
        roomId: room.id,
        bedId: bed.id,
        joiningDate: s.joiningDate,
        address: s.address,
        emergencyContact: s.emergencyContact,
        profilePhoto: s.profilePhoto,
        idProofType: 'Aadhaar Card',
        idProofUrl: '/mock-id-proof.pdf',
        status: s.status,
        monthlyFee: s.monthlyFee,
        securityDeposit: 5000,
      },
    });

    // Mark bed as occupied
    await prisma.bed.update({
      where: { id: bed.id },
      data: { isOccupied: true },
    });

    // Create student login user accounts for residents
    const studentPasswordHash = bcrypt.hashSync('StudentPassword@2026', 10);
    if (s.email) {
      await prisma.user.create({
        data: {
          name: s.fullName,
          email: s.email.toLowerCase(),
          username: s.email.split('@')[0],
          passwordHash: studentPasswordHash,
          role: 'STUDENT',
          phone: s.phone,
          studentId: student.id,
          emailVerified: new Date(),
          phoneVerified: new Date(),
          authProvider: 'credentials',
          avatar: s.profilePhoto,
        },
      });
    }

    // Generate monthly payment records
    // Months: August, September, October 2026
    const months = [
      { name: 'August 2026', idx: 8, due: new Date('2026-08-05') },
      { name: 'September 2026', idx: 9, due: new Date('2026-09-05') },
      { name: 'October 2026', idx: 10, due: new Date('2026-10-05') },
    ];

    for (const m of months) {
      let status = 'PAID';
      let amountPaid = s.monthlyFee;
      const monthStr = String(m.idx).padStart(2, '0');
      let paymentDate = new Date(`2026-${monthStr}-04T11:30:00Z`);
      let paymentMethod = 'UPI';
      let txId = `UPI${m.idx}902847291${student.studentId.slice(-3)}`;

      if (m.name === 'October 2026') {
        status = s.feeStatus;
        if (status === 'PENDING') {
          amountPaid = 0;
          paymentDate = null;
          paymentMethod = null;
          txId = null;
        } else if (status === 'OVERDUE') {
          amountPaid = 0;
          paymentDate = null;
          paymentMethod = null;
          txId = null;
        } else if (status === 'PARTIALLY_PAID') {
          amountPaid = 3000;
          paymentDate = new Date('2026-10-02T15:20:00Z');
          paymentMethod = 'UPI';
        }
      }

      // If student is Arjun Reddy and overdue, September was also overdue
      if (s.studentId === 'ABH-2026-004' && m.name === 'September 2026') {
        status = 'OVERDUE';
        amountPaid = 0;
        paymentDate = null;
        paymentMethod = null;
        txId = null;
      }

      const payment = await prisma.payment.create({
        data: {
          studentId: student.id,
          month: m.name,
          monthIndex: m.idx,
          year: 2026,
          amount: s.monthlyFee,
          amountPaid: amountPaid,
          dueDate: m.due,
          paymentDate: paymentDate,
          status: status,
          paymentMethod: paymentMethod,
          transactionId: txId,
          remarks: status === 'PAID' ? 'Fee received on time' : status === 'PARTIALLY_PAID' ? 'Partial balance of ₹2,000 pending' : 'Pending payment',
        },
      });

      // If paid by UPI, generate a receipt
      if (status === 'PAID' && paymentDate) {
        await prisma.receipt.create({
          data: {
            paymentId: payment.id,
            studentId: student.id,
            month: m.name,
            amount: s.monthlyFee,
            paymentDate: paymentDate,
            paymentMethod: paymentMethod,
            transactionId: txId,
            fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
            fileName: `Receipt_${m.name.replace(' ', '_')}_${s.studentId}.pdf`,
            fileSize: 142850,
            fileType: 'application/pdf',
            status: 'APPROVED',
            adminNotes: 'Verified against bank settlement report',
          },
        });
      }
    }

    createdStudents.push(student);
  }

  console.log('Creating Complaints...');
  await prisma.complaint.createMany({
    data: [
      {
        studentId: createdStudents[0].id,
        studentName: createdStudents[0].fullName,
        roomNumber: '101',
        title: 'Ceiling fan making vibrating sound at speed 4',
        description: 'The ceiling fan in Room 101 makes high rattling noise at high speeds, disturbing nighttime sleep.',
        category: 'FAN',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        resolutionNotes: 'Electrician called for tomorrow morning 11 AM.',
        createdAt: new Date('2026-09-29T10:15:00Z'),
      },
      {
        studentId: createdStudents[3].id,
        studentName: createdStudents[3].fullName,
        roomNumber: '102',
        title: 'Wi-Fi connectivity drop near study desk',
        description: 'Wi-Fi signal drops completely at the second study table corner. Router signal seems obstructed.',
        category: 'WIFI',
        priority: 'LOW',
        status: 'RESOLVED',
        resolutionNotes: 'Access point rebooted and range extender installed on 1st floor corridor.',
        resolvedAt: new Date('2026-09-30T16:00:00Z'),
        createdAt: new Date('2026-09-28T09:00:00Z'),
      },
      {
        studentId: createdStudents[7].id,
        studentName: createdStudents[7].fullName,
        roomNumber: '103',
        title: 'Washroom tap slow drip and handle loose',
        description: 'Attached washroom basin tap is dripping constantly, causing water wastage and noise.',
        category: 'BATHROOM',
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date('2026-10-01T08:30:00Z'),
      },
      {
        studentId: createdStudents[10].id,
        studentName: createdStudents[10].fullName,
        roomNumber: '201',
        title: 'Tube light flickering in Room 201',
        description: 'The main tube light turns off and on intermittently when other switches are pressed.',
        category: 'LIGHT',
        priority: 'LOW',
        status: 'OPEN',
        createdAt: new Date('2026-10-01T14:20:00Z'),
      },
    ],
  });

  console.log('Creating Announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Monthly Fee Due Reminder - October 2026',
        content: 'Dear Residents, this is a reminder that hostel monthly fees for October 2026 are due by 5th October 2026. Please submit receipt via portal or pay at office to avoid ₹100/day late fee.',
        category: 'FEE',
        priority: 'IMPORTANT',
        isActive: true,
        postedBy: 'Abhishek Sharma (Admin)',
        createdAt: new Date('2026-10-01T09:00:00Z'),
      },
      {
        title: 'High-Speed Wi-Fi Maintenance & Router Upgrade',
        content: 'Hostel internet broadband will undergo scheduled maintenance and bandwidth upgrade on Saturday midnight (2:00 AM - 4:30 AM). Minimal disruption expected.',
        category: 'MAINTENANCE',
        priority: 'NORMAL',
        isActive: true,
        postedBy: 'Chief Warden',
        createdAt: new Date('2026-09-30T15:00:00Z'),
      },
      {
        title: 'Strict Gate Timing Adherence Notice',
        content: 'All residents are once again reminded that the main gate closes strictly at 10:00 PM. Any resident arriving after 10:00 PM without prior signed warden slip will face disciplinary action.',
        category: 'RULE',
        priority: 'URGENT',
        isActive: true,
        postedBy: 'Chief Warden',
        createdAt: new Date('2026-09-28T18:00:00Z'),
      },
      {
        title: 'Upcoming Festival Special Dinner & Celebration',
        content: 'Special festival dinner with Sweets, Paneer Tikka, and Biryani will be served on 24th October in the dining hall from 8:00 PM onwards.',
        category: 'EVENT',
        priority: 'NORMAL',
        isActive: true,
        postedBy: 'Mess Committee',
        createdAt: new Date('2026-09-25T11:00:00Z'),
      },
    ],
  });

  console.log('Creating Visitors...');
  await prisma.visitor.createMany({
    data: [
      {
        visitorName: 'S. K. Kumar',
        phone: '+91 94112 34567',
        studentId: createdStudents[0].id,
        studentName: 'Ravi Kumar',
        roomNumber: '101',
        visitDate: new Date('2026-10-01'),
        entryTime: '04:30 PM',
        exitTime: '05:45 PM',
        purpose: 'Meeting son and delivering winter clothes',
        idProofType: 'Aadhaar Card',
      },
      {
        visitorName: 'M. Teja',
        phone: '+91 94223 45678',
        studentId: createdStudents[1].id,
        studentName: 'Sai Teja',
        roomNumber: '101',
        visitDate: new Date('2026-10-01'),
        entryTime: '05:15 PM',
        exitTime: null,
        purpose: 'Handing over college project supplies',
        idProofType: 'Driving License',
      },
      {
        visitorName: 'Ramesh Reddy',
        phone: '+91 94445 67890',
        studentId: createdStudents[3].id,
        studentName: 'Arjun Reddy',
        roomNumber: '102',
        visitDate: new Date('2026-09-30'),
        entryTime: '02:00 PM',
        exitTime: '03:30 PM',
        purpose: 'Family visit',
        idProofType: 'Voter ID',
      },
    ],
  });

  console.log('Creating Expenses...');
  await prisma.expense.createMany({
    data: [
      {
        title: 'State Electricity Bill - Sept 2026',
        category: 'ELECTRICITY',
        amount: 28450,
        date: new Date('2026-09-28'),
        description: 'Main commercial meter bill payment (Paid online)',
        recordedBy: 'Abhishek Sharma',
      },
      {
        title: 'Weekly Vegetable & Milk Supply (Mess)',
        category: 'FOOD',
        amount: 14200,
        date: new Date('2026-09-29'),
        description: 'Fresh vegetables, milk crates, and curd from Mandi',
        recordedBy: 'Ramesh Verma',
      },
      {
        title: 'Airtel Commercial Fiber 300 Mbps Internet',
        category: 'INTERNET',
        amount: 4500,
        date: new Date('2026-09-25'),
        description: 'Monthly static IP leased line connection',
        recordedBy: 'Abhishek Sharma',
      },
      {
        title: 'Commercial RO Water Purifier Servicing',
        category: 'WATER',
        amount: 3200,
        date: new Date('2026-09-24'),
        description: 'Filter cartridge and membrane replacement for 250 LPH plant',
        recordedBy: 'Ramesh Verma',
      },
      {
        title: 'Hostel Cleaning & Phenyl Supplies',
        category: 'CLEANING',
        amount: 2800,
        date: new Date('2026-09-22'),
        description: 'Brooms, mops, floor cleaner, and detergent for washrooms',
        recordedBy: 'Ramesh Verma',
      },
      {
        title: 'Plumber & Electrician Maintenance Labour',
        category: 'MAINTENANCE',
        amount: 3500,
        date: new Date('2026-09-20'),
        description: '2nd floor geyser repair and corridor light replacement',
        recordedBy: 'Ramesh Verma',
      },
    ],
  });

  console.log('Creating Weekly Mess Menu...');
  const mealSchedule = [
    {
      dayOfWeek: 'Monday',
      breakfast: 'Poha with Sev, Boiled Eggs / Sprouted Moong, Tea & Milk',
      lunch: 'Rajma Masala, Steamed Basmati Rice, Seasonal Veg, Phulka Roti, Curd',
      snacks: 'Veg Cutlet / Bread Pakoda, Ginger Tea',
      dinner: 'Aloo Gobi, Dal Tadka, Phulka Roti, Rice, Gulab Jamun',
    },
    {
      dayOfWeek: 'Tuesday',
      breakfast: 'Aloo Paratha with Amul Butter & Pickle, Curd, Tea & Coffee',
      lunch: 'Chole Bhature, Jeera Rice, Onion Salad, Boondi Raita',
      snacks: 'Samosa with Mint Chutney, Tea',
      dinner: 'Kadhai Paneer, Mix Dal, Fresh Phulkas, Steamed Rice',
    },
    {
      dayOfWeek: 'Wednesday',
      breakfast: 'South Indian Idli, Medu Vada, Coconut Chutney, Sambhar, Filter Coffee',
      lunch: 'Kadhi Pakoda, Zeera Pulao, Aloo Shimla Mirch, Chapati, Papad',
      snacks: 'Sweet Corn Chaat, Masala Chai',
      dinner: 'Egg Curry / Matar Paneer, Dal Makhani, Tandoori Roti, Pulao',
    },
    {
      dayOfWeek: 'Thursday',
      breakfast: 'Masala Dosa, Sambhar, Tomato & Coconut Chutney, Tea & Milk',
      lunch: 'Dum Aloo Kashmiri, Yellow Dal Fry, Peas Pulao, Hot Rotis, Green Salad',
      snacks: 'Biscuits & Roasted Peanuts, Elaichi Chai',
      dinner: 'Bhindi Do Pyaza, Moong Dal, Roti, Rice, Fruit Custard',
    },
    {
      dayOfWeek: 'Friday',
      breakfast: 'Pav Bhaji / Bread Omelette, Bananas, Tea & Coffee',
      lunch: 'Dal Makhani, Shahi Paneer, Jeera Rice, Naan / Roti, Cucumber Raita',
      snacks: 'Maggi / Macaroni Pasta, Tea',
      dinner: 'Veg Biryani with Mirchi ka Salan, Veg Raita, Sewaiyan Kheer',
    },
    {
      dayOfWeek: 'Saturday',
      breakfast: 'Methi Thepla / Puri Bhaji, Pickle, Curd, Tea & Milk',
      lunch: 'Mix Veg Korma, Dal Tadka, Steamed Rice, Phulkas, Roasted Papad',
      snacks: 'Bhel Puri, Cutting Chai',
      dinner: 'Soyabean Curry, Chana Dal, Hot Chapatis, Rice, Ice Cream',
    },
    {
      dayOfWeek: 'Sunday',
      breakfast: 'Chole Kulche / Bread Butter Jam & Boiled Eggs, Tea & Cold Coffee',
      lunch: 'Special Chicken Curry / Shahi Paneer Butter Masala, Kashmiri Pulao, Garlic Naan, Raita',
      snacks: 'Onion & Paneer Pakoda, Masala Chai',
      dinner: 'Light Khichdi / Dal Chawal, Papad, Achar, Fresh Salad',
      isSpecialDay: true,
      notes: 'Sunday Special Lunch: Non-Veg / Paneer Special Feast',
    },
  ];

  for (const m of mealSchedule) {
    await prisma.mealMenu.create({
      data: m,
    });
  }

  console.log('Creating Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        title: 'Fee Payment Pending',
        message: '4 students have pending fee payments for October 2026 due on 5th Oct.',
        type: 'FEE_DUE',
        isRead: false,
        link: '/fees',
        createdAt: new Date('2026-10-01T09:00:00Z'),
      },
      {
        title: 'New Complaint Logged',
        message: 'Student Pranav Joshi reported bathroom tap leakage in Room 103.',
        type: 'COMPLAINT_CREATED',
        isRead: false,
        link: '/complaints',
        createdAt: new Date('2026-10-01T08:30:00Z'),
      },
      {
        title: 'Payment Received via UPI',
        message: '₹5,000 payment received from Ravi Kumar (Room 101) for October 2026.',
        type: 'PAYMENT_RECEIVED',
        isRead: true,
        link: '/payments',
        createdAt: new Date('2026-10-01T07:15:00Z'),
      },
      {
        title: 'Bed Available in Room 101',
        message: 'Bed 3 in Room 101 is vacant and ready for new student admission.',
        type: 'BED_VACANCY',
        isRead: true,
        link: '/rooms',
        createdAt: new Date('2026-09-30T10:00:00Z'),
      },
    ],
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
