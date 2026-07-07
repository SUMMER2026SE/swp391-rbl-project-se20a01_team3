import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Clock,
  FileText,
  ImagePlus,
  Loader2,
  Send,
  Square,
  X,
} from 'lucide-react';
import DashboardHeader from '../../components/DashboardHeader';
import LatexText from '../../components/LatexText';
import { isApiError } from '../../api/client';
import { notify } from '../../lib/toast';
import {
  getStudentExam,
  submitStudentExam,
  type StudentExam,
  type StudentExamAnswerImageUpload,
  type StudentExamQuestion,
  type StudentExamSubmissionResponse,
  type SubmitExamAnswer,
  uploadStudentExamAnswerImage,
} from '../../api/studentExamService';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_ANSWER_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ANSWER_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_ANSWER_IMAGE_COUNT = 10;

function formatPoints(value: number | null | undefined) {
  if (value == null) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function questionTypeLabel(type: string) {
  if (type === 'essay') return 'Tu luan';
  if (type === 'multiple') return 'Nhieu dap an';
  return 'Mot dap an';
}

function orderQuestionsObjectiveFirst(questions: StudentExamQuestion[]) {
  return [
    ...questions.filter(question => question.type !== 'essay'),
    ...questions.filter(question => question.type === 'essay'),
  ];
}

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function StudentExamPage() {
  const { courseId, slotIndex } = useParams<{ courseId: string; slotIndex: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get('returnTo') || (courseId ? `/courses/${courseId}?learn=1` : '/courses');
  const parsedSlotIndex = Number(slotIndex);

  const [exam, setExam] = useState<StudentExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number[]>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [essayImages, setEssayImages] = useState<Record<string, StudentExamAnswerImageUpload[]>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submission, setSubmission] = useState<StudentExamSubmissionResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const orderedQuestions = useMemo(
    () => orderQuestionsObjectiveFirst(exam?.questions ?? []),
    [exam],
  );

  useEffect(() => {
    if (!courseId || !Number.isInteger(parsedSlotIndex)) {
      setErrorMsg('Duong dan bai kiem tra khong hop le.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMsg('');
    getStudentExam(courseId, parsedSlotIndex)
      .then(data => {
        if (cancelled) return;
        setExam(data);
        setSelectedAnswers({});
        setEssayAnswers({});
        setEssayImages({});
        setUploadingImages({});
        setSubmitError('');
        setSubmission(null);
        setRemainingSeconds(Math.max(0, data.durationMinutes * 60));
      })
      .catch(err => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Khong tai duoc bai kiem tra.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, parsedSlotIndex]);

  const answeredCount = useMemo(() => {
    if (!exam) return 0;
    return orderedQuestions.filter(question => {
      if (question.type === 'essay') {
        return Boolean(essayAnswers[question.id]?.trim()) || (essayImages[question.id]?.length ?? 0) > 0;
      }
      return (selectedAnswers[question.id] ?? []).length > 0;
    }).length;
  }, [essayAnswers, essayImages, exam, orderedQuestions, selectedAnswers]);

  const hasUploadingImages = useMemo(
    () => Object.values(uploadingImages).some(Boolean),
    [uploadingImages],
  );

  useEffect(() => {
    if (!exam || loading || submission) return;
    setRemainingSeconds(prev => prev ?? Math.max(0, exam.durationMinutes * 60));
  }, [exam, loading, submission]);

  function toggleChoice(questionId: string, optionIndex: number, multiple: boolean) {
    if (submission) return;
    setSelectedAnswers(prev => {
      const current = prev[questionId] ?? [];
      if (!multiple) {
        return { ...prev, [questionId]: [optionIndex] };
      }
      const exists = current.includes(optionIndex);
      return {
        ...prev,
        [questionId]: exists
          ? current.filter(value => value !== optionIndex)
          : [...current, optionIndex].sort((a, b) => a - b),
      };
    });
  }

  async function handleAddEssayImage(questionId: string, files: FileList | null) {
    if (!courseId || submission || !files?.length) return;

    const selectedFiles = Array.from(files);
    const currentCount = essayImages[questionId]?.length ?? 0;
    if (currentCount + selectedFiles.length > MAX_ANSWER_IMAGE_COUNT) {
      notify.error(`Moi cau tu luan toi da ${MAX_ANSWER_IMAGE_COUNT} anh dap an.`);
      return;
    }

    for (const file of selectedFiles) {
      if (!ACCEPTED_ANSWER_IMAGE_TYPES.includes(file.type)) {
        notify.error('Chi ho tro anh PNG, JPG hoac WEBP.');
        return;
      }
      if (file.size > MAX_ANSWER_IMAGE_BYTES) {
        notify.error('Moi anh dap an toi da 5 MB.');
        return;
      }
    }

    setUploadingImages(prev => ({ ...prev, [questionId]: true }));
    try {
      const uploadedImages: StudentExamAnswerImageUpload[] = [];
      for (const file of selectedFiles) {
        uploadedImages.push(await uploadStudentExamAnswerImage(courseId, file));
      }
      setEssayImages(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] ?? []), ...uploadedImages],
      }));
      setSubmitError('');
      notify.success(`Da tai len ${uploadedImages.length} anh dap an.`);
    } catch (err) {
      notify.error(isApiError(err) ? err.message : 'Khong the tai anh dap an.');
    } finally {
      setUploadingImages(prev => ({ ...prev, [questionId]: false }));
    }
  }

  function removeEssayImage(questionId: string, imageUrl: string) {
    if (submission) return;
    setEssayImages(prev => ({
      ...prev,
      [questionId]: (prev[questionId] ?? []).filter(image => image.url !== imageUrl),
    }));
  }

  async function handleSubmitExam(forceSubmit = false) {
    if (!courseId || !exam || submitting || submission) return;
    if (hasUploadingImages) {
      setSubmitError('Vui long doi tai anh dap an xong roi nop bai.');
      return;
    }
    if (!forceSubmit && answeredCount < exam.questionCount) {
      setSubmitError('Vui long tra loi day du cac cau truoc khi nop bai.');
      return;
    }

    const answers = orderedQuestions.reduce<Record<string, SubmitExamAnswer>>((acc, question) => {
      if (question.type === 'essay') {
        acc[question.id] = {
          selectedIndices: [],
          textAnswer: essayAnswers[question.id]?.trim() ?? '',
          imageUrls: (essayImages[question.id] ?? []).map(image => image.url),
        };
      } else {
        acc[question.id] = {
          selectedIndices: selectedAnswers[question.id] ?? [],
          textAnswer: '',
          imageUrls: [],
        };
      }
      return acc;
    }, {});

    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await submitStudentExam(courseId, parsedSlotIndex, answers);
      setSubmission(result);
      setRemainingSeconds(0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Khong the nop bai kiem tra.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!exam || loading || submitting || submission || remainingSeconds == null) return;
    if (remainingSeconds <= 0) {
      handleSubmitExam(true);
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemainingSeconds(current => (current == null ? current : Math.max(0, current - 1)));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [
    answeredCount,
    courseId,
    essayAnswers,
    essayImages,
    exam,
    hasUploadingImages,
    loading,
    parsedSlotIndex,
    remainingSeconds,
    selectedAnswers,
    submission,
    submitting,
  ]);

  const isTimeUrgent = remainingSeconds != null && remainingSeconds <= 300;
  const displayTime = remainingSeconds == null
    ? exam
      ? `${exam.durationMinutes} phut`
      : '--:--'
    : formatRemainingTime(remainingSeconds);

  return (
    <div className="min-h-screen bg-surface font-sans">
      <DashboardHeader />

      <header className="border-b border-outline-variant/30 bg-surface-container">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lai chuong trinh hoc
          </button>
          {exam && (
            <div className={`hidden items-center gap-2 text-xs font-bold sm:flex ${
              isTimeUrgent ? 'text-red-500' : 'text-on-surface-variant'
            }`}>
              <Clock className="h-4 w-4" />
              {displayTime}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold text-on-surface-variant">Dang tai bai kiem tra...</p>
            </div>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <h1 className="font-extrabold">Khong the mo bai kiem tra</h1>
                <p className="mt-1 text-sm font-medium">{errorMsg}</p>
                <Link
                  to={returnTo}
                  className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
                >
                  Ve chuong trinh hoc
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && exam && (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <section className="min-w-0 space-y-5">
              <div>
                <p className="text-sm font-bold uppercase text-primary">
                  Bai kiem tra sau {exam.placementChapterTitle ?? 'chuong da chon'}
                </p>
                <h1 className="mt-1 text-3xl font-extrabold text-on-surface">{exam.name}</h1>
                {exam.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
                    {exam.description}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                  <Clock className={`mb-2 h-5 w-5 ${isTimeUrgent ? 'text-red-500' : 'text-primary'}`} />
                  <p className="text-xs font-bold uppercase text-on-surface-variant">Thoi gian</p>
                  <p className={`mt-1 text-xl font-extrabold ${isTimeUrgent ? 'text-red-500' : 'text-on-surface'}`}>
                    {displayTime}
                  </p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">
                    Thoi luong tong: {exam.durationMinutes} phut
                  </p>
                </div>
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4">
                  <FileText className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-xs font-bold uppercase text-on-surface-variant">So cau</p>
                  <p className="mt-1 text-xl font-extrabold text-on-surface">{exam.questionCount}</p>
                </div>
              </div>

              <div className="space-y-4">
                {orderedQuestions.map((question, questionIndex) => {
                  const selected = selectedAnswers[question.id] ?? [];
                  const uploadedImages = essayImages[question.id] ?? [];
                  const isUploading = Boolean(uploadingImages[question.id]);

                  return (
                    <article
                      key={question.id}
                      className="rounded-2xl border border-outline-variant/40 bg-surface p-5"
                    >
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary">
                              Cau {questionIndex + 1}
                            </span>
                            <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                              {questionTypeLabel(question.type)}
                            </span>
                          </div>
                          <div className="text-base font-semibold leading-relaxed text-on-surface">
                            <LatexText content={question.text} />
                          </div>
                        </div>
                        <span className="flex-shrink-0 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold text-amber-600">
                          {formatPoints(question.points)} diem
                        </span>
                      </div>

                      {question.type === 'essay' ? (
                        <div className="space-y-3">
                          <textarea
                            value={essayAnswers[question.id] ?? ''}
                            onChange={event => setEssayAnswers(prev => ({
                              ...prev,
                              [question.id]: event.target.value,
                            }))}
                            disabled={Boolean(submission)}
                            rows={5}
                            placeholder="Nhap cau tra loi tu luan..."
                            className="w-full resize-y rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
                          />

                          <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-bold text-on-surface">Anh dap an</p>
                                <p className="text-xs text-on-surface-variant">
                                  PNG, JPG, WEBP - toi da 5 MB moi anh - toi da {MAX_ANSWER_IMAGE_COUNT} anh
                                </p>
                              </div>
                              <label className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
                                submission || isUploading
                                  ? 'cursor-not-allowed bg-surface-container text-on-surface-variant'
                                  : 'cursor-pointer bg-primary/10 text-primary hover:bg-primary/15'
                              }`}>
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ImagePlus className="h-4 w-4" />
                                )}
                                {isUploading ? 'Dang tai...' : 'Tai anh len'}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  multiple
                                  disabled={Boolean(submission) || isUploading}
                                  className="hidden"
                                  onChange={event => {
                                    handleAddEssayImage(question.id, event.target.files);
                                    event.target.value = '';
                                  }}
                                />
                              </label>
                            </div>

                            {uploadedImages.length > 0 && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {uploadedImages.map((image, imageIndex) => (
                                  <div
                                    key={image.url}
                                    className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface"
                                  >
                                    <a href={image.url} target="_blank" rel="noreferrer">
                                      <img
                                        src={image.url}
                                        alt={image.name}
                                        className="h-36 w-full object-cover"
                                      />
                                    </a>
                                    <div className="flex items-start justify-between gap-2 px-3 py-2">
                                      <div className="min-w-0">
                                        <p className="truncate text-xs font-bold text-on-surface">
                                          Anh {imageIndex + 1}
                                        </p>
                                        <p className="truncate text-[11px] text-on-surface-variant">
                                          {image.name}
                                        </p>
                                      </div>
                                      {!submission && (
                                        <button
                                          type="button"
                                          onClick={() => removeEssayImage(question.id, image.url)}
                                          className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container hover:text-red-500"
                                          title="Xoa anh"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const checked = selected.includes(optionIndex);
                            return (
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                onClick={() => toggleChoice(question.id, optionIndex, question.type === 'multiple')}
                                disabled={Boolean(submission)}
                                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                  checked
                                    ? 'border-primary/40 bg-primary/10'
                                    : 'border-outline-variant/50 bg-surface-container-lowest hover:border-primary/30'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                                    checked ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                                  }`}>
                                    {OPTION_LABELS[optionIndex] ?? optionIndex + 1}
                                  </span>
                                  <span className="mt-1 flex-shrink-0 text-primary">
                                    {checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                  </span>
                                  <span className="min-w-0 text-sm font-medium leading-relaxed text-on-surface">
                                    <LatexText content={option} />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
                <p className="text-sm font-extrabold text-on-surface">Tien do lam bai</p>
                <div className="mt-4 h-2 rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${exam.questionCount ? (answeredCount / exam.questionCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-on-surface-variant">
                  Da tra loi {answeredCount}/{exam.questionCount} cau
                </p>
                <div className="mt-4 space-y-2 text-xs font-medium text-on-surface-variant">
                  <p>Pham vi: {exam.scopeStartChapterTitle ?? 'Chuong dau'} - {exam.placementChapterTitle ?? 'chuong dat bai kiem tra'}</p>
                  <p>Tong diem: {formatPoints(exam.totalPoints)}</p>
                  <p>So lan lam toi da: {exam.maxAttempts}</p>
                  <p className={isTimeUrgent ? 'font-bold text-red-500' : ''}>
                    Con lai: {displayTime}
                  </p>
                  {hasUploadingImages && (
                    <p className="font-bold text-amber-600">Dang tai anh dap an, vui long doi mot chut.</p>
                  )}
                </div>
                {submitError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                    {submitError}
                  </div>
                )}
                {submission ? (
                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                    <p className="text-sm font-extrabold">Da nop bai kiem tra</p>
                    <p className="mt-1 text-xs font-semibold">
                      Trac nghiem dung {submission.correctObjectiveCount}/{submission.totalObjectiveCount} cau.
                    </p>
                    {submission.status === 'pending' ? (
                      <p className="mt-1 text-xs font-semibold">
                        Diem trac nghiem da duoc cham may: {submission.autoScorePercent}%.
                        Phan tu luan da duoc gui sang giao vien de cham tiep.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-semibold">
                        Diem tu dong: {submission.autoScorePercent}% - Bai da duoc cham xong.
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitExam()}
                    disabled={submitting || answeredCount < exam.questionCount || hasUploadingImages}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? 'Dang nop bai...' : 'Nop bai kiem tra'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(returnTo)}
                  className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/90"
                >
                  Quay lai hoc tiep
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
