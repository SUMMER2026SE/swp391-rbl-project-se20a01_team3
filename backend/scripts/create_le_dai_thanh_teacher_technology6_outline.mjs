import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEACHER_NAME = "Giáo Viên Lê Đại Thành";
const COURSE_SLUG = "cong-nghe-6";
const CATEGORY_SLUG = "cong-nghe";

const chapters = [
  {
    position: 1,
    title: "Chương 1: Nhà ở",
    lessons: [
      "Bài 1: Khái quát về nhà ở",
      "Bài 2: Xây dựng nhà ở",
      "Bài 3: Ngôi nhà thông minh",
      "Ôn tập chương 1: Nhà ở",
    ],
  },
  {
    position: 2,
    title: "Chương 2: Bảo quản và chế biến thực phẩm",
    lessons: [
      "Bài 4: Thực phẩm và dinh dưỡng",
      "Bài 5: Phương pháp bảo quản và chế biến thực phẩm",
      "Bài 6: Dự án: Bữa ăn kết nối yêu thương",
      "Ôn tập chương 2: Bảo quản và chế biến thực phẩm",
    ],
  },
  {
    position: 3,
    title: "Chương 3: Trang phục và thời trang",
    lessons: [
      "Bài 7: Trang phục trong đời sống",
      "Bài 8: Sử dụng và bảo quản trang phục",
      "Bài 9: Thời trang",
      "Ôn tập chương 3: Trang phục và thời trang",
    ],
  },
  {
    position: 4,
    title: "Chương 4: Đồ dùng điện trong gia đình",
    lessons: [
      "Bài 10: Khái quát về đồ dùng điện trong gia đình",
      "Bài 11: Đèn điện",
      "Bài 12: Nồi cơm điện",
      "Bài 13: Bếp hồng ngoại",
      "Bài 14: Dự án: An toàn và tiết kiệm trong gia đình",
      "Ôn tập chương 4: Đồ dùng điện trong gia đình",
    ],
  },
];

function readDotEnv(filePath) {
  const values = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return values;
}

function buildPath(table, params) {
  return `${table}?${new URLSearchParams(params)}`;
}

async function request(context, method, endpoint, body) {
  const response = await fetch(`${context.supabaseUrl}/rest/v1/${endpoint}`, {
    method,
    headers: {
      apikey: context.serviceRoleKey,
      Authorization: `Bearer ${context.serviceRoleKey}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method === "POST" || method === "PATCH"
        ? { Prefer: "return=representation" }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${endpoint} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function getSingle(context, table, params, notFoundMessage) {
  const rows = await request(context, "GET", buildPath(table, params));
  if (rows.length !== 1) {
    throw new Error(rows.length === 0 ? notFoundMessage : `${notFoundMessage} (tìm thấy ${rows.length} bản ghi)`);
  }
  return rows[0];
}

async function ensureChapter(context, courseId, outline) {
  const existing = await request(context, "GET", buildPath("chapters", {
    select: "id,title,position",
    course_id: `eq.${courseId}`,
    position: `eq.${outline.position}`,
  }));

  if (existing.length > 1) {
    throw new Error(`Có nhiều chương ở vị trí ${outline.position}; dừng để tránh ghi đè.`);
  }
  if (existing.length === 1) {
    if (existing[0].title !== outline.title) {
      throw new Error(`Vị trí chương ${outline.position} đã có nội dung khác: "${existing[0].title}".`);
    }
    return existing[0];
  }

  const created = await request(context, "POST", "chapters", {
    course_id: courseId,
    title: outline.title,
    description: null,
    position: outline.position,
  });
  return created[0];
}

async function ensureLesson(context, chapterId, title, position) {
  const existing = await request(context, "GET", buildPath("lessons", {
    select: "id,title,position",
    chapter_id: `eq.${chapterId}`,
    position: `eq.${position}`,
  }));

  if (existing.length > 1) {
    throw new Error(`Có nhiều bài ở vị trí ${position} trong chương ${chapterId}; dừng để tránh ghi đè.`);
  }
  if (existing.length === 1) {
    if (existing[0].title !== title) {
      throw new Error(`Vị trí bài ${position} đã có nội dung khác: "${existing[0].title}".`);
    }
    return existing[0];
  }

  const created = await request(context, "POST", "lessons", {
    chapter_id: chapterId,
    title,
    description: null,
    duration_sec: 0,
    position,
    is_free: false,
  });
  return created[0];
}

async function main() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const env = readDotEnv(path.resolve(currentDir, "..", ".env"));
  const context = {
    supabaseUrl: env.SUPABASE_URL.replace(/\/+$/, ""),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const teacher = await getSingle(context, "profiles", {
    select: "id,full_name,role",
    full_name: `eq.${TEACHER_NAME}`,
    role: "eq.teacher",
  }, `Không tìm thấy giáo viên "${TEACHER_NAME}".`);

  const category = await getSingle(context, "categories", {
    select: "id,slug,name",
    slug: `eq.${CATEGORY_SLUG}`,
  }, `Không tìm thấy môn "${CATEGORY_SLUG}".`);

  const course = await getSingle(context, "courses", {
    select: "id,slug,title,status,grades,category_id",
    teacher_id: `eq.${teacher.id}`,
    slug: `eq.${COURSE_SLUG}`,
  }, `Không tìm thấy khóa "${COURSE_SLUG}" của giáo viên.`);

  if (course.status !== "draft") {
    throw new Error(`Khóa học đang ở trạng thái ${course.status}; chỉ cập nhật khung cho bản nháp.`);
  }
  if (course.category_id !== category.id || !course.grades?.includes(6)) {
    throw new Error("Khóa học không thuộc đúng môn Công nghệ hoặc không dành cho lớp 6.");
  }

  const chapterRows = [];
  for (const outline of chapters) {
    const chapter = await ensureChapter(context, course.id, outline);
    chapterRows.push(chapter);
    for (let index = 0; index < outline.lessons.length; index += 1) {
      await ensureLesson(context, chapter.id, outline.lessons[index], index + 1);
    }
  }

  const chapterIds = chapterRows.map((chapter) => chapter.id);
  const allLessons = await request(context, "GET", buildPath("lessons", {
    select: "id,duration_sec",
    chapter_id: `in.(${chapterIds.join(",")})`,
  }));
  const totalDuration = allLessons.reduce((sum, lesson) => sum + (lesson.duration_sec ?? 0), 0);

  await request(context, "PATCH", buildPath("courses", { id: `eq.${course.id}` }), {
    total_chapters: chapterRows.length,
    total_lessons: allLessons.length,
    total_duration_sec: totalDuration,
  });

  console.log(JSON.stringify({
    teacher: teacher.full_name,
    courseId: course.id,
    course: course.title,
    chapters: chapterRows.length,
    lessons: allLessons.length,
    totalDurationSec: totalDuration,
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
