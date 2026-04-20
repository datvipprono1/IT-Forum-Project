const dotenv = require("dotenv");

const { ensurePasswordUser } = require("../services/firebaseAuthService");

dotenv.config();

const DEFAULT_PASSWORD = process.env.FIREBASE_DEFAULT_PASSWORD || "123456";

const students = [
  {
    fullName: "Nguyễn Thành Đạt",
    studentId: "1721031253",
  },
  {
    fullName: "Lâm Gia Ngọc Phát",
    studentId: "1721031268",
  },
  {
    fullName: "Phạm Thị Hải Yến",
    studentId: "1721031394",
  },
];

async function seedStudents() {
  const results = [];

  for (const student of students) {
    const email = `${student.studentId}@dntu.edu.vn`;

    try {
      const authUser = await ensurePasswordUser({
        email,
        password: DEFAULT_PASSWORD,
        displayName: student.fullName,
      });

      results.push({
        studentId: student.studentId,
        fullName: student.fullName,
        email,
        authStatus: authUser.status,
        uid: authUser.uid,
      });
    } catch (error) {
      results.push({
        studentId: student.studentId,
        fullName: student.fullName,
        email,
        authStatus: "failed",
        uid: "",
        error: error.code || error.message,
      });
    }
  }

  console.table(results);

  const hasFailure = results.some((item) => item.authStatus === "failed");

  if (hasFailure) {
    process.exitCode = 1;
  }
}

seedStudents().catch((error) => {
  console.error("Seed script failed:", error.message);
  process.exit(1);
});
