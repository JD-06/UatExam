-- UAT Forms - Database initialization script
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "User" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "nombre"       TEXT NOT NULL,
  "email"        TEXT NOT NULL UNIQUE,
  "password"     TEXT NOT NULL,
  "rol"          TEXT NOT NULL,
  "matricula"    TEXT,
  "carrera"      TEXT,
  "departamento" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Group" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "nombre"      TEXT NOT NULL,
  "descripcion" TEXT,
  "materia"     TEXT NOT NULL,
  "semestre"    TEXT NOT NULL,
  "carrera"     TEXT,
  "codigo"      TEXT NOT NULL UNIQUE,
  "profesorId"  TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("profesorId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "GroupMember" (
  "userId"   TEXT NOT NULL,
  "groupId"  TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "groupId"),
  FOREIGN KEY ("userId")  REFERENCES "User"("id"),
  FOREIGN KEY ("groupId") REFERENCES "Group"("id")
);

CREATE TABLE IF NOT EXISTS "Form" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "titulo"            TEXT NOT NULL,
  "descripcion"       TEXT,
  "profesorId"        TEXT NOT NULL,
  "tipo"              TEXT NOT NULL DEFAULT 'formulario',
  "estado"            TEXT NOT NULL DEFAULT 'borrador',
  "fechaInicio"       TIMESTAMP(3),
  "fechaCierre"       TIMESTAMP(3),
  "tiempoLimite"      INTEGER,
  "intentosMax"       INTEGER NOT NULL DEFAULT 1,
  "mostrarResultados" BOOLEAN NOT NULL DEFAULT true,
  "aleatorio"         BOOLEAN NOT NULL DEFAULT false,
  "password"          TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("profesorId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "FormGroup" (
  "formId"      TEXT NOT NULL,
  "groupId"     TEXT NOT NULL,
  "fechaLimite" TIMESTAMP(3),
  PRIMARY KEY ("formId", "groupId"),
  FOREIGN KEY ("formId")  REFERENCES "Form"("id") ON DELETE CASCADE,
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Question" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "formId"            TEXT NOT NULL,
  "orden"             INTEGER NOT NULL,
  "tipo"              TEXT NOT NULL,
  "texto"             TEXT NOT NULL,
  "puntaje"           INTEGER NOT NULL DEFAULT 0,
  "obligatoria"       BOOLEAN NOT NULL DEFAULT false,
  "retroalimentacion" TEXT,
  "mediaUrl"          TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "QuestionOption" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "texto"      TEXT NOT NULL,
  "orden"      INTEGER NOT NULL,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CorrectAnswer" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "questionId" TEXT NOT NULL,
  "optionId"   TEXT NOT NULL,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Response" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "formId"          TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "grupoId"         TEXT,
  "calificacion"    DOUBLE PRECISION,
  "calificacionMax" DOUBLE PRECISION,
  "completadoEn"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tiempoUsado"     INTEGER,
  FOREIGN KEY ("formId") REFERENCES "Form"("id"),
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE IF NOT EXISTS "Answer" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "responseId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "valor"      TEXT,
  "archivos"   TEXT[] DEFAULT '{}',
  FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE,
  FOREIGN KEY ("questionId") REFERENCES "Question"("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "tipo"      TEXT NOT NULL,
  "mensaje"   TEXT NOT NULL,
  "leida"     BOOLEAN NOT NULL DEFAULT false,
  "data"      JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);
