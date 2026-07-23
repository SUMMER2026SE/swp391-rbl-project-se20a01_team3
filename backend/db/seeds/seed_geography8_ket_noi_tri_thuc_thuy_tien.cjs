/*
 * Seed khung chương/bài cho khóa "Địa Lí 8 - Kết nối tri thức"
 * của giáo viên Thủy Tiên.
 *
 * Kiểm tra không ghi dữ liệu:
 *   node db/seeds/seed_geography8_ket_noi_tri_thuc_thuy_tien.cjs
 *
 * Ghi dữ liệu:
 *   node db/seeds/seed_geography8_ket_noi_tri_thuc_thuy_tien.cjs --apply
 *
 * An toàn khi chạy lại:
 * - Chỉ chọn khóa học thuộc tài khoản giáo viên có tên Thủy Tiên.
 * - Không ghi đè chương/bài khác đang chiếm cùng vị trí.
 * - Không thay đổi video, tài liệu hoặc tài nguyên đã được thêm sau này.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const APPLY = process.argv.includes("--apply");
const UUID_V5_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const NS = uuidv5(
  "beeacademy.seed.geography8.ket-noi-tri-thuc.thuy-tien",
  UUID_V5_DNS,
);

const CHAPTERS = [
  {
    title: "Vị trí địa lí và phạm vi lãnh thổ, địa hình và khoáng sản Việt Nam",
    lessons: [
      "Vị trí địa lí và phạm vi lãnh thổ Việt Nam",
      "Địa hình Việt Nam",
      "Khoáng sản Việt Nam",
    ],
  },
  {
    title: "Khí hậu và thủy văn Việt Nam",
    lessons: [
      "Khí hậu Việt Nam",
      "Thực hành: Vẽ và phân tích biểu đồ khí hậu",
      "Thủy văn Việt Nam",
      "Vai trò của tài nguyên khí hậu và tài nguyên nước đối với sự phát triển kinh tế - xã hội của nước ta",
      "Tác động của biến đổi khí hậu đối với khí hậu và thủy văn Việt Nam",
    ],
  },
  {
    title: "Thổ nhưỡng và sinh vật Việt Nam",
    lessons: [
      "Thổ nhưỡng Việt Nam",
      "Sinh vật Việt Nam",
    ],
  },
  {
    title: "Biển đảo Việt Nam",
    lessons: [
      "Phạm vi biển Đông. Vùng biển đảo và đặc điểm tự nhiên vùng biển đảo Việt Nam",
      "Môi trường và tài nguyên thiên nhiên biển đảo Việt Nam",
    ],
  },
];

function uuidv5(name, namespace) {
  const namespaceBytes = Buffer.from(namespace.replace(/-/g, ""), "hex");
  const hash = crypto
    .createHash("sha1")
    .update(Buffer.concat([namespaceBytes, Buffer.from(name)]))
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function id(key) {
  return uuidv5(key, NS);
}

function canonical(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadEnv() {
  const envPath = path.resolve(__dirname, "../../.env");
  const env = {};
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const separator = line.indexOf("=");
    env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return env;
}

async function findTargetCourse(client) {
  const result = await client.query(
    `select c.id, c.slug, c.title, c.teacher_id, c.status::text as status,
            c.total_chapters, c.total_lessons, p.full_name as teacher_name
       from public.courses c
       join public.profiles p on p.id = c.teacher_id
      where p.role::text = 'teacher'
      order by p.full_name, c.title`,
  );

  const candidates = result.rows.filter((row) => {
    const teacherName = canonical(row.teacher_name);
    const courseTitle = canonical(row.title);
    return teacherName.includes("thuy tien")
      && courseTitle.includes("dia li 8")
      && courseTitle.includes("ket noi tri thuc");
  });

  if (candidates.length !== 1) {
    const details = candidates.map((row) => (
      `${row.teacher_name} | ${row.title} | ${row.id}`
    )).join("\n");
    throw new Error(
      `Cần đúng 1 khóa Địa Lí 8 - Kết nối tri thức của giáo viên Thủy Tiên, tìm thấy ${candidates.length}.`
      + (details ? `\n${details}` : ""),
    );
  }
  return candidates[0];
}

async function inspectExistingStructure(client, courseId) {
  const result = await client.query(
    `select ch.id as chapter_id, ch.position as chapter_position, ch.title as chapter_title,
            l.id as lesson_id, l.position as lesson_position, l.title as lesson_title
       from public.chapters ch
       left join public.lessons l on l.chapter_id = ch.id
      where ch.course_id = $1
      order by ch.position, l.position`,
    [courseId],
  );
  return result.rows;
}

function assertCompatible(existingRows) {
  const chaptersByPosition = new Map();
  for (const row of existingRows) {
    if (!chaptersByPosition.has(row.chapter_position)) {
      chaptersByPosition.set(row.chapter_position, {
        title: row.chapter_title,
        lessons: new Map(),
      });
    }
    if (row.lesson_id) {
      chaptersByPosition
        .get(row.chapter_position)
        .lessons.set(row.lesson_position, row.lesson_title);
    }
  }

  for (const [chapterIndex, chapter] of CHAPTERS.entries()) {
    const chapterPosition = chapterIndex + 1;
    const existingChapter = chaptersByPosition.get(chapterPosition);
    if (!existingChapter) continue;
    if (canonical(existingChapter.title) !== canonical(chapter.title)) {
      throw new Error(
        `Chương ${chapterPosition} đang là "${existingChapter.title}", không ghi đè bằng "${chapter.title}".`,
      );
    }

    for (const [lessonIndex, lessonTitle] of chapter.lessons.entries()) {
      const lessonPosition = lessonIndex + 1;
      const existingLessonTitle = existingChapter.lessons.get(lessonPosition);
      if (
        existingLessonTitle
        && canonical(existingLessonTitle) !== canonical(lessonTitle)
      ) {
        throw new Error(
          `Chương ${chapterPosition}, bài vị trí ${lessonPosition} đang là "${existingLessonTitle}", `
          + `không ghi đè bằng "${lessonTitle}".`,
        );
      }
    }
  }
}

async function seed(client, course) {
  await client.query("begin");
  try {
    const existingRows = await inspectExistingStructure(client, course.id);
    assertCompatible(existingRows);

    for (const [chapterIndex, chapter] of CHAPTERS.entries()) {
      const chapterPosition = chapterIndex + 1;
      const chapterId = id(`chapter.${chapterPosition}`);
      const chapterDescription = `Khung Chương ${chapterPosition}: ${chapter.title}.`;
      const chapterResult = await client.query(
        `insert into public.chapters (id, course_id, title, description, position)
         values ($1, $2, $3, $4, $5)
         on conflict (course_id, position) do update set
           title = excluded.title,
           description = coalesce(public.chapters.description, excluded.description)
         returning id`,
        [
          chapterId,
          course.id,
          chapter.title,
          chapterDescription,
          chapterPosition,
        ],
      );

      for (const [lessonIndex, lessonTitle] of chapter.lessons.entries()) {
        const lessonPosition = lessonIndex + 1;
        const lessonId = id(`chapter.${chapterPosition}.lesson.${lessonPosition}`);
        const lessonDescription = `Khung Bài ${CHAPTERS
          .slice(0, chapterIndex)
          .reduce((total, item) => total + item.lessons.length, 0) + lessonPosition}: ${lessonTitle}.`;
        await client.query(
          `insert into public.lessons
             (id, chapter_id, title, description, position, duration_sec, is_free, resources,
              video_url, video_embed_url, video_storage_path)
           values ($1, $2, $3, $4, $5, 0, false, '[]'::jsonb, null, null, null)
           on conflict (chapter_id, position) do update set
             title = excluded.title,
             description = coalesce(public.lessons.description, excluded.description)`,
          [
            lessonId,
            chapterResult.rows[0].id,
            lessonTitle,
            lessonDescription,
            lessonPosition,
          ],
        );
      }
    }

    await client.query(
      `update public.courses c set
         total_chapters = summary.total_chapters,
         total_lessons = summary.total_lessons,
         total_duration_sec = summary.total_duration_sec,
         updated_at = now()
       from (
         select ch.course_id,
                count(distinct ch.id)::int as total_chapters,
                count(l.id)::int as total_lessons,
                coalesce(sum(l.duration_sec), 0)::int as total_duration_sec
           from public.chapters ch
           left join public.lessons l on l.chapter_id = ch.id
          where ch.course_id = $1
          group by ch.course_id
       ) summary
      where c.id = summary.course_id`,
      [course.id],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main() {
  const env = loadEnv();
  const client = new Client({
    host: env.SUPABASE_DB_HOST,
    port: Number(env.SUPABASE_DB_PORT),
    database: env.SUPABASE_DB_NAME,
    user: env.SUPABASE_DB_USER,
    password: env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  try {
    const course = await findTargetCourse(client);
    const before = await inspectExistingStructure(client, course.id);
    assertCompatible(before);

    console.log(`Giáo viên : ${course.teacher_name}`);
    console.log(`Khóa học  : ${course.title}`);
    console.log(`Course ID : ${course.id}`);
    console.log(`Hiện có   : ${course.total_chapters} chương, ${course.total_lessons} bài`);

    if (!APPLY) {
      console.log(`Dự kiến   : ${CHAPTERS.length} chương, ${CHAPTERS.reduce(
        (total, chapter) => total + chapter.lessons.length,
        0,
      )} bài`);
      console.log("Chưa ghi dữ liệu. Thêm --apply để thực hiện.");
      return;
    }

    await seed(client, course);
    const after = await client.query(
      `select c.total_chapters, c.total_lessons,
              count(distinct ch.id)::int as actual_chapters,
              count(l.id)::int as actual_lessons,
              count(l.video_url)::int as direct_videos,
              count(l.video_embed_url)::int as embed_videos,
              count(l.video_storage_path)::int as stored_videos
         from public.courses c
         left join public.chapters ch on ch.course_id = c.id
         left join public.lessons l on l.chapter_id = ch.id
        where c.id = $1
        group by c.id`,
      [course.id],
    );
    const result = after.rows[0];
    console.log("Đã tạo khung khóa học thành công:");
    console.log(`  Chương   : ${result.total_chapters} (thực tế ${result.actual_chapters})`);
    console.log(`  Bài học  : ${result.total_lessons} (thực tế ${result.actual_lessons})`);
    console.log(
      `  Video    : ${result.direct_videos + result.embed_videos + result.stored_videos}`,
    );
    console.log("  Tài liệu : không thêm mới");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
