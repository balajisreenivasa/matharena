// Classrooms: a parent or teacher (an "educator") groups students and watches their
// progress. Students join with a 6-character code, or the educator adds them by the
// email of an existing profile. Every read of a student's data by an educator goes
// through canViewStudent(), so a classroom owner only ever sees their own members.
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { getLearner, type Learner } from "./learner";
import { normalizeEmail } from "./auth";
import type { Classroom, User } from "@prisma/client";

export const EDUCATOR_ROLES = new Set(["parent", "teacher"]);

export function isEducator(user: { role: string }): boolean {
  return EDUCATOR_ROLES.has(user.role);
}

// The signed-in parent/teacher, or a redirect: to /login when signed out, to / when a
// student opens an educator page.
export async function getEducator(): Promise<Learner> {
  const user = await getLearner();
  if (!isEducator(user)) redirect("/");
  return user;
}

// Unambiguous alphabet (no 0/O, 1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/0/g, "O").replace(/1/g, "I");
}

export async function createClassroom(ownerId: string, name: string): Promise<Classroom> {
  const clean = name.trim().slice(0, 60) || "My classroom";
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    if (await db.classroom.findUnique({ where: { code } })) continue;
    return db.classroom.create({ data: { ownerId, name: clean, code } });
  }
  throw new Error("could not allocate a classroom code");
}

export type JoinResult = { ok: true; classroom: Classroom } | { ok: false; error: string };

export async function joinByCode(studentId: string, code: string): Promise<JoinResult> {
  const classroom = await db.classroom.findUnique({ where: { code: normalizeCode(code) } });
  if (!classroom) return { ok: false, error: "No classroom has that code." };
  if (classroom.ownerId === studentId) return { ok: false, error: "That is your own classroom." };
  await db.classroomMember.upsert({
    where: { classroomId_studentId: { classroomId: classroom.id, studentId } },
    update: {},
    create: { classroomId: classroom.id, studentId },
  });
  return { ok: true, classroom };
}

export async function addStudentByEmail(classroomId: string, ownerId: string, email: string): Promise<{ ok: true; student: User } | { ok: false; error: string }> {
  const classroom = await db.classroom.findFirst({ where: { id: classroomId, ownerId } });
  if (!classroom) return { ok: false, error: "Classroom not found." };
  const student = await db.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!student) return { ok: false, error: "No profile with that email. The student creates a profile first, or joins with the code." };
  if (student.id === ownerId) return { ok: false, error: "That is you." };
  if (isEducator(student)) return { ok: false, error: "That profile is a parent/teacher account, not a student." };
  await db.classroomMember.upsert({
    where: { classroomId_studentId: { classroomId, studentId: student.id } },
    update: {},
    create: { classroomId, studentId: student.id },
  });
  return { ok: true, student };
}

export async function removeStudent(classroomId: string, ownerId: string, studentId: string): Promise<void> {
  const classroom = await db.classroom.findFirst({ where: { id: classroomId, ownerId } });
  if (!classroom) return;
  await db.classroomMember.deleteMany({ where: { classroomId, studentId } });
}

export async function leaveClassroom(studentId: string, classroomId: string): Promise<void> {
  await db.classroomMember.deleteMany({ where: { classroomId, studentId } });
}

export async function listClassroomsFor(ownerId: string) {
  return db.classroom.findMany({ where: { ownerId }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "asc" } });
}

export async function getClassroomForOwner(id: string, ownerId: string) {
  return db.classroom.findFirst({
    where: { id, ownerId },
    include: { members: { include: { student: { include: { plan: true } } }, orderBy: { joinedAt: "asc" } } },
  });
}

// True when `viewerId` owns a classroom the student belongs to (or is the student).
export async function canViewStudent(viewerId: string, studentId: string): Promise<boolean> {
  if (viewerId === studentId) return true;
  const n = await db.classroomMember.count({ where: { studentId, classroom: { ownerId: viewerId } } });
  return n > 0;
}

export async function membershipsFor(studentId: string) {
  return db.classroomMember.findMany({ where: { studentId }, include: { classroom: { include: { owner: { select: { name: true, email: true, role: true } } } } }, orderBy: { joinedAt: "asc" } });
}
