/*
  Grade workflow store holds in-memory/localStorage data for teacher grade sheets,
  head-of-class aggregation, and student-facing results. This is a client-side
  data layer that mirrors how backend persistence could behave.
*/

import { nanoid } from "nanoid";

export type GradeColumn = {
  id: string;
  name: string;
  maxScore: number;
};

export type GradeSheetStatus = "draft" | "submitted" | "approved";

type ScoreMap = Record<string, number | null>;

export type StudentRecord = {
  id: string;
  name: string;
  rollNo: string;
};

type SubjectDefinition = {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
};

export type ClassDefinition = {
  id: string;
  name: string;
  headTeacherId: string;
  headTeacherName: string;
  students: StudentRecord[];
  subjects: SubjectDefinition[];
};

type GradeSheetRecord = {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  status: GradeSheetStatus;
  columns: GradeColumn[];
  scores: Record<string, ScoreMap>;
  submittedAt?: string;
  approvedAt?: string;
  updatedAt: string;
};

type RankingEntry = {
  studentId: string;
  studentName: string;
  rollNo: string;
  subjectScores: Record<string, { subjectName: string; score: number }>;
  total: number;
  average: number;
  highestSubject: number;
  position: number;
};

type ClassFinalResult = {
  classId: string;
  // When the Head of Class finishes consolidation, they SUBMIT for approval.
  submitted: boolean;
  submittedAt?: string;
  submittedBy?: string;
  // Head of School (or authorized approver) sets the final APPROVED state.
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  rankings: RankingEntry[];
};

type GradeWorkflowStore = {
  classes: ClassDefinition[];
  gradeSheets: GradeSheetRecord[];
  finalResults: Record<string, ClassFinalResult>;
  // optional client-side metadata used for local persistence/versioning
  _meta?: {
    localVersion?: number;
    lastLocalSavedAt?: string;
    deviceId?: string;
  };
};

const STORAGE_KEY = "grade-workflow-store";
let memoryStore: GradeWorkflowStore | null = null;
const IDB_DB_NAME = "pathways-ui";
const IDB_STORE_NAME = "kv";
const IDB_KEY = STORAGE_KEY;

// Per-browser unique id to help signal edits from different devices/sessions
let DEVICE_ID: string | null = null;
if (typeof window !== "undefined") {
  DEVICE_ID = window.localStorage.getItem("grade-device-id");
  if (!DEVICE_ID) {
    try {
      DEVICE_ID = nanoid(8);
      window.localStorage.setItem("grade-device-id", DEVICE_ID);
    } catch {
      // fallback
      DEVICE_ID = String(Date.now());
    }
  }
}

// IndexedDB helpers (lightweight, no external deps)
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }
    const req = window.indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<unknown | null> {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readonly");
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return null; // Handle error silently
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readwrite");
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug("workflowStore: idbSet failed", err);
  }
}

/** Load the raw local snapshot from IndexedDB (if any) */
export async function loadLocalSnapshot(): Promise<GradeWorkflowStore | null> {
  try {
    const raw = await idbGet(IDB_KEY);
    return raw as GradeWorkflowStore | null;
  } catch {
    return null; // Handle error silently
  }
}

/** Get the updatedAt timestamp for a given sheet id from the current store */
export function getSheetUpdatedAt(sheetId: string): string | undefined {
  const s = getStore();
  const sheet = s.gradeSheets.find((g) => g.id === sheetId);
  return sheet?.updatedAt;
}

/** Restore the entire in-memory store from the IndexedDB snapshot (if present) */
export async function restoreLocalSnapshot(): Promise<boolean> {
  try {
    const snap = await loadLocalSnapshot();
    if (!snap) return false;
    // write into memory and localStorage via persist
    persist(snap);
    return true;
  } catch {
    return false; // Handle error silently
  }
}

const seedStore: GradeWorkflowStore = createSeedStore();

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedStore(): GradeWorkflowStore {
  // Intentionally return empty arrays so the UI relies on server data for classes,
  // and does not expose any mocked teachers, students or grade sheets.
  return { classes: [], gradeSheets: [], finalResults: {} };
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function getStore(): GradeWorkflowStore {
  if (memoryStore) return memoryStore;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        memoryStore = JSON.parse(raw) as GradeWorkflowStore;
        return memoryStore;
      } catch {
        // fall through to seed
      }
    }
  }
  memoryStore = deepCopy(seedStore);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  }
  // asynchronously attempt to hydrate from IndexedDB if it has a newer copy
  if (typeof window !== "undefined") {
    (async () => {
      try {
        const idbValue = await idbGet(IDB_KEY);
        if (!idbValue) return;
        const idbStore = idbValue as GradeWorkflowStore;
        // compare latest updatedAt across gradeSheets
        const idbLatest = latestUpdatedAt(idbStore);
        const localLatest = latestUpdatedAt(memoryStore as GradeWorkflowStore);
        if (idbLatest && (!localLatest || idbLatest > localLatest)) {
          // adopt IDB copy as authoritative locally
          memoryStore = deepCopy(idbStore);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
          // notify consumers that store was hydrated from IDB
          try {
            window.dispatchEvent(
              new CustomEvent("grade-workflow-store:hydrated", {
                detail: { source: "idb" },
              })
            );
          } catch (err) {
            console.debug("workflowStore: hydration dispatch failed", err);
          }
        }
      } catch (err) {
        console.debug("workflowStore: idb hydration failed", err);
      }
    })();
  }
  return memoryStore;
}

function persist(store: GradeWorkflowStore) {
  // annotate meta and persist to both localStorage and IndexedDB (async)
  memoryStore = store;
  if (typeof window !== "undefined") {
    store._meta = store._meta || {};
    store._meta.localVersion = (store._meta.localVersion || 0) + 1;
    store._meta.lastLocalSavedAt = new Date().toISOString();
    if (DEVICE_ID) store._meta.deviceId = DEVICE_ID;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.debug(
        "workflowStore: localStorage write failed during persist",
        err
      );
    }
    // fire-and-forget async sync to IndexedDB
    (async () => {
      try {
        await idbSet(IDB_KEY, store);
      } catch (e) {
        console.debug("workflowStore: idb persist failed", e);
      }
    })();
  }
}

function latestUpdatedAt(
  s: GradeWorkflowStore | null | undefined
): string | null {
  if (!s || !s.gradeSheets || s.gradeSheets.length === 0) return null;
  let latest: string | null = null;
  s.gradeSheets.forEach((g) => {
    if (!g.updatedAt) return;
    if (!latest || g.updatedAt > latest) latest = g.updatedAt;
  });
  return latest;
}

function cloneStore(): GradeWorkflowStore {
  return deepCopy(getStore());
}

type TeacherContext = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  sheetId: string;
  status: GradeSheetStatus;
};

export function getTeacherAssignments(teacherId: string): TeacherContext[] {
  const store = getStore();
  const assignments: TeacherContext[] = [];
  store.classes.forEach((cls) => {
    cls.subjects
      .filter((subj) => subj.teacherId === teacherId)
      .forEach((subj) => {
        const sheet = store.gradeSheets.find(
          (s) => s.classId === cls.id && s.subjectId === subj.id
        );
        if (sheet) {
          assignments.push({
            classId: cls.id,
            className: cls.name,
            subjectId: subj.id,
            subjectName: subj.name,
            sheetId: sheet.id,
            status: sheet.status,
          });
        }
      });
  });
  return assignments;
}

export type TeacherSheetView = {
  sheetId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  status: GradeSheetStatus;
  columns: GradeColumn[];
  students: StudentRecord[];
  scores: Record<string, ScoreMap>;
  totals: Record<string, number>;
  averages: Record<string, number>;
  completion: number;
  submittedAt?: string;
  approvedAt?: string;
  lockReason?: string;
};

export function getTeacherSheet(
  teacherId: string,
  classId: string,
  subjectId: string
): TeacherSheetView | null {
  const store = getStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  const subject = cls.subjects.find(
    (s) => s.id === subjectId && s.teacherId === teacherId
  );
  if (!subject) return null;
  const sheet = store.gradeSheets.find(
    (s) =>
      s.classId === classId &&
      s.subjectId === subjectId &&
      s.teacherId === teacherId
  );
  if (!sheet) return null;
  const totals: Record<string, number> = {};
  const averages: Record<string, number> = {};
  cls.students.forEach((student) => {
    const subjectScore = computeSubjectScore(sheet, student.id);
    totals[student.id] = subjectScore;
    averages[student.id] = subjectScore;
  });
  const completion = computeCompletion(sheet, cls.students.length);
  return {
    sheetId: sheet.id,
    classId: cls.id,
    className: cls.name,
    subjectId: subject.id,
    subjectName: subject.name,
    status: sheet.status,
    columns: deepCopy(sheet.columns),
    students: deepCopy(cls.students),
    scores: deepCopy(sheet.scores),
    totals,
    averages,
    completion,
    submittedAt: sheet.submittedAt,
    approvedAt: sheet.approvedAt,
    lockReason:
      sheet.status === "submitted"
        ? "Sheet submitted and awaiting head-of-class processing"
        : sheet.status === "approved"
        ? "Class results finalized; sheet locked"
        : undefined,
  };
}

function computeSubjectScore(
  sheet: GradeSheetRecord,
  studentId: string
): number {
  const row = sheet.scores[studentId];
  if (!row || sheet.columns.length === 0) return 0;
  const filled = sheet.columns.map((col) => {
    const value = row[col.id];
    if (value === null || value === undefined) return 0;
    return clampScore(value);
  });
  const sum = filled.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / sheet.columns.length);
}

function computeCompletion(
  sheet: GradeSheetRecord,
  studentCount: number
): number {
  const totalCells = sheet.columns.length * Math.max(studentCount, 1);
  if (totalCells === 0) return 0;
  let filled = 0;
  Object.values(sheet.scores).forEach((row) => {
    sheet.columns.forEach((col) => {
      const val = row[col.id];
      if (typeof val === "number" && !Number.isNaN(val)) {
        filled += 1;
      }
    });
  });
  return Math.round((filled / totalCells) * 100);
}

type UpdateScoreArgs = {
  sheetId: string;
  studentId: string;
  columnId: string;
  value: number | "";
};

export function updateTeacherScore(
  args: UpdateScoreArgs
): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === args.sheetId);
  if (!sheet) return null;
  if (sheet.status !== "draft")
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  const value = args.value === "" ? null : clampScore(Number(args.value));
  if (!sheet.scores[args.studentId]) {
    sheet.scores[args.studentId] = {};
  }
  sheet.scores[args.studentId][args.columnId] = value;
  sheet.updatedAt = new Date().toISOString();
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

type AddColumnArgs = {
  sheetId: string;
  name: string;
  maxScore: number;
};

export function addTeacherColumn(args: AddColumnArgs): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === args.sheetId);
  if (!sheet) return null;
  if (sheet.status !== "draft")
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  const name = args.name.trim();
  if (!name)
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  const maxScore = clampScore(args.maxScore);
  const id = `col_${nanoid(6)}`;
  sheet.columns.push({ id, name, maxScore });
  Object.keys(sheet.scores).forEach((studentId) => {
    sheet.scores[studentId][id] = null;
  });
  sheet.updatedAt = new Date().toISOString();
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

type EditColumnArgs = {
  sheetId: string;
  columnId: string;
  name: string;
  maxScore: number;
};

export function editTeacherColumn(
  args: EditColumnArgs
): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === args.sheetId);
  if (!sheet) return null;
  if (sheet.status !== "draft")
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  const col = sheet.columns.find((c) => c.id === args.columnId);
  if (!col)
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  col.name = args.name.trim() || col.name;
  col.maxScore = clampScore(args.maxScore || col.maxScore);
  sheet.updatedAt = new Date().toISOString();
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

type DeleteColumnArgs = {
  sheetId: string;
  columnId: string;
};

export function deleteTeacherColumn(
  args: DeleteColumnArgs
): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === args.sheetId);
  if (!sheet) return null;
  if (sheet.status !== "draft")
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  sheet.columns = sheet.columns.filter((c) => c.id !== args.columnId);
  Object.keys(sheet.scores).forEach((studentId) => {
    delete sheet.scores[studentId][args.columnId];
  });
  sheet.updatedAt = new Date().toISOString();
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

export function submitGradeSheet(sheetId: string): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === sheetId);
  if (!sheet) return null;
  if (sheet.status !== "draft")
    return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
  sheet.status = "submitted";
  sheet.submittedAt = new Date().toISOString();
  sheet.updatedAt = sheet.submittedAt;
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

export function resetGradeSheet(sheetId: string): TeacherSheetView | null {
  const store = cloneStore();
  const sheet = store.gradeSheets.find((s) => s.id === sheetId);
  if (!sheet) return null;
  sheet.status = "draft";
  sheet.submittedAt = undefined;
  sheet.approvedAt = undefined;
  sheet.updatedAt = new Date().toISOString();
  persist(store);
  return getTeacherSheet(sheet.teacherId, sheet.classId, sheet.subjectId);
}

export type HeadClassSummary = {
  classId: string;
  className: string;
  subjects: Array<{
    id: string;
    name: string;
    teacherName: string;
    status: GradeSheetStatus;
    submittedAt?: string;
  }>;
  students: StudentRecord[];
  rows: RankingEntry[];
  missingSubjects: string[];
  canApprove: boolean;
  // Head of Class has submitted the consolidated results to Head of School
  submitted?: boolean;
  submittedAt?: string;
  approved: boolean;
  approvedAt?: string;
};
export type HeadClassAssignment = {
  classId: string;
  className: string;
  totalStudents: number;
  totalSubjects: number;
  submittedSubjects: number;
  status: "pending" | "ready" | "submitted" | "approved";
  approvedAt?: string;
};

export function getHeadTeacherClasses(
  headTeacherId: string
): HeadClassAssignment[] {
  const store = getStore();
  return store.classes
    .filter((cls) => cls.headTeacherId === headTeacherId)
    .map((cls) => {
      const sheets = store.gradeSheets.filter((s) => s.classId === cls.id);
      const submittedSubjects = sheets.filter(
        (sheet) => sheet.status === "submitted" || sheet.status === "approved"
      ).length;
      const totalSubjects = cls.subjects.length;
      const final = store.finalResults[cls.id];
      const status: "pending" | "ready" | "approved" | "submitted" =
        final?.approved
          ? "approved"
          : final?.submitted
          ? "submitted"
          : submittedSubjects === totalSubjects
          ? "ready"
          : "pending";
      return {
        classId: cls.id,
        className: cls.name,
        totalStudents: cls.students.length,
        totalSubjects,
        submittedSubjects,
        status,
        approvedAt: final?.approvedAt,
      };
    });
}

export function getAllClasses(): ClassDefinition[] {
  const store = getStore();
  return deepCopy(store.classes);
}

/**
 * Save a local snapshot of the entire workflow store. This triggers persist
 * which writes to localStorage and async-syncs to IndexedDB. Returns true
 * when the action was performed.
 */
export function saveLocalSnapshot(): boolean {
  try {
    const store = cloneStore();
    persist(store);
    return true;
  } catch {
    return false;
  }
}

export function getLocalMeta() {
  const s = getStore();
  return s._meta;
}

/**
 * Merge server-provided canonical classes into the local workflow store.
 * This ensures the head UI shows the same classes/sections the admin manages.
 *
 * Entries should be objects with { id: string, name?: string }
 * where `id` is the canonical classId (e.g. "11A").
 */
export function applyServerClasses(
  entries: Array<{ id: string; name?: string }>
): void {
  if (!entries || !entries.length) return;
  const store = cloneStore();
  const byId = new Map(
    store.classes.map((c) => [c.id, c] as [string, ClassDefinition])
  );
  const updated: ClassDefinition[] = [];

  entries.forEach((entry) => {
    const existing = byId.get(entry.id);
    if (existing) {
      // Preserve students, subjects and head assignment but update name
      existing.name = entry.name ?? existing.name;
      updated.push(existing);
      byId.delete(entry.id);
    } else {
      // New class — create minimal shell so the UI can display it
      updated.push({
        id: entry.id,
        name: entry.name ?? entry.id,
        headTeacherId: "",
        headTeacherName: "",
        students: [],
        subjects: [],
      });
    }
  });

  // Optionally keep any local-only classes that weren't returned by the server
  // (avoids accidental deletion of in-memory artifacts). Append them after.
  Array.from(byId.values()).forEach((left) => updated.push(left));

  // Persist merged list
  store.classes = updated;
  persist(store);
}

export function setClassHead(
  classId: string,
  teacherId: string,
  teacherName: string
): ClassDefinition | null {
  const store = cloneStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  cls.headTeacherId = teacherId;
  cls.headTeacherName = teacherName;
  persist(store);
  return deepCopy(cls);
}

export function applyHeadAssignments(
  entries: Array<{
    classId: string;
    headTeacherId: string;
    headTeacherName: string;
  }>
): void {
  if (!entries.length) return;
  const store = cloneStore();
  let updated = false;
  entries.forEach((entry) => {
    const cls = store.classes.find((c) => c.id === entry.classId);
    if (!cls) return;
    if (
      cls.headTeacherId !== entry.headTeacherId ||
      cls.headTeacherName !== entry.headTeacherName
    ) {
      cls.headTeacherId = entry.headTeacherId;
      cls.headTeacherName = entry.headTeacherName;
      updated = true;
    }
  });
  if (updated) {
    persist(store);
  } else {
    memoryStore = store;
  }
}

export function getHeadClassSummary(classId: string): HeadClassSummary | null {
  const store = getStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  const sheets = store.gradeSheets.filter((s) => s.classId === classId);
  const subjectMap = new Map<string, GradeSheetRecord>();
  sheets.forEach((sheet) => subjectMap.set(sheet.subjectId, sheet));
  const subjects = cls.subjects.map((subject) => {
    const sheet = subjectMap.get(subject.id);
    return {
      id: subject.id,
      name: subject.name,
      teacherName: subject.teacherName,
      status: sheet?.status ?? "draft",
      submittedAt: sheet?.submittedAt,
    };
  });

  const rows = buildRankingRows(cls, sheets);
  const missingSubjects = subjects
    .filter((s) => s.status !== "submitted" && s.status !== "approved")
    .map((s) => s.name);

  const finalResult = store.finalResults[classId];
  return {
    classId: cls.id,
    className: cls.name,
    subjects,
    students: deepCopy(cls.students),
    rows,
    missingSubjects,
    canApprove: missingSubjects.length === 0,
    submitted: finalResult?.submitted ?? false,
    submittedAt: finalResult?.submittedAt,
    approved: finalResult?.approved ?? false,
    approvedAt: finalResult?.approvedAt,
  };
}

function buildRankingRows(
  cls: ClassDefinition,
  sheets: GradeSheetRecord[]
): RankingEntry[] {
  const subjectLookup = new Map<string, GradeSheetRecord>();
  sheets.forEach((sheet) => {
    subjectLookup.set(sheet.subjectId, sheet);
  });

  const rows: RankingEntry[] = cls.students.map((student) => {
    const subjectScores: RankingEntry["subjectScores"] = {};
    let total = 0;
    let highestSubject = 0;
    let contributingSubjects = 0;
    cls.subjects.forEach((subject) => {
      const sheet = subjectLookup.get(subject.id);
      if (!sheet) return;
      const score = computeSubjectScore(sheet, student.id);
      subjectScores[subject.id] = {
        subjectName: subject.name,
        score,
      };
      total += score;
      highestSubject = Math.max(highestSubject, score);
      contributingSubjects += 1;
    });
    const average = contributingSubjects ? total / contributingSubjects : 0;
    return {
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      subjectScores,
      total: Math.round(total),
      average: Math.round(average * 100) / 100,
      highestSubject,
      position: 0,
    };
  });

  rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.highestSubject !== a.highestSubject)
      return b.highestSubject - a.highestSubject;
    return a.studentName.localeCompare(b.studentName);
  });

  rows.forEach((row, idx) => {
    row.position = idx + 1;
  });
  return rows;
}

export function approveClassResults(
  classId: string,
  headTeacherId: string
): HeadClassSummary | null {
  const store = cloneStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  if (cls.headTeacherId !== headTeacherId) return null;
  const sheets = store.gradeSheets.filter((s) => s.classId === classId);
  const missing = cls.subjects.filter((subject) => {
    const sheet = sheets.find((s) => s.subjectId === subject.id);
    return !sheet || sheet.status !== "submitted";
  });
  if (missing.length > 0) {
    return getHeadClassSummary(classId);
  }

  const approvedAt = new Date().toISOString();
  sheets.forEach((sheet) => {
    sheet.status = "approved";
    sheet.approvedAt = approvedAt;
  });
  const rows = buildRankingRows(cls, sheets);
  store.finalResults[classId] = {
    classId,
    submitted: true,
    submittedAt: store.finalResults[classId]?.submittedAt ?? approvedAt,
    submittedBy: store.finalResults[classId]?.submittedBy ?? headTeacherId,
    approved: true,
    approvedAt,
    approvedBy: headTeacherId,
    rankings: rows,
  };
  persist(store);
  return getHeadClassSummary(classId);
}

/**
 * Submit consolidated class results to Head of School for approval.
 * Does NOT mark individual subject sheets as approved; it only freezes a snapshot
 * of rankings and sets the class finalResults to submitted=true, approved=false.
 */
export function submitClassFinal(
  classId: string,
  headTeacherId: string
): HeadClassSummary | null {
  const store = cloneStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  if (cls.headTeacherId !== headTeacherId) return null;
  const sheets = store.gradeSheets.filter((s) => s.classId === classId);
  // All subjects must be at least submitted
  const missing = cls.subjects.filter((subject) => {
    const sheet = sheets.find((s) => s.subjectId === subject.id);
    return !sheet || sheet.status !== "submitted";
  });
  if (missing.length > 0) {
    // Not ready; return current summary without changing state
    return getHeadClassSummary(classId);
  }
  const rows = buildRankingRows(cls, sheets);
  const submittedAt = new Date().toISOString();
  store.finalResults[classId] = {
    classId,
    submitted: true,
    submittedAt,
    submittedBy: headTeacherId,
    approved: false,
    rankings: rows,
  } as ClassFinalResult;
  persist(store);
  return getHeadClassSummary(classId);
}

type StudentResult = {
  classId: string;
  className: string;
  approved: boolean;
  approvedAt?: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  total: number;
  average: number;
  rank: number;
  outOf: number;
  subjectScores: Array<{
    subjectId: string;
    subjectName: string;
    score: number;
  }>;
};

export function getStudentResult(
  classId: string,
  studentId: string
): StudentResult | null {
  const store = getStore();
  const cls = store.classes.find((c) => c.id === classId);
  if (!cls) return null;
  const final = store.finalResults[classId];
  if (!final || !final.approved)
    return {
      classId: cls.id,
      className: cls.name,
      approved: false,
      studentId,
      studentName: cls.students.find((s) => s.id === studentId)?.name ?? "",
      rollNo: cls.students.find((s) => s.id === studentId)?.rollNo ?? "",
      total: 0,
      average: 0,
      rank: 0,
      outOf: cls.students.length,
      subjectScores: cls.subjects.map((subject) => ({
        subjectId: subject.id,
        subjectName: subject.name,
        score: 0,
      })),
    };
  const entry = final.rankings.find((r) => r.studentId === studentId);
  if (!entry) return null;
  return {
    classId: cls.id,
    className: cls.name,
    approved: true,
    approvedAt: final.approvedAt,
    studentId,
    studentName: entry.studentName,
    rollNo: entry.rollNo,
    total: entry.total,
    average: entry.average,
    rank: entry.position,
    outOf: final.rankings.length,
    subjectScores: Object.entries(entry.subjectScores).map(
      ([subjectId, meta]) => ({
        subjectId,
        subjectName: meta.subjectName,
        score: meta.score,
      })
    ),
  };
}

export function clearGradeWorkflowStore() {
  memoryStore = deepCopy(seedStore);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
