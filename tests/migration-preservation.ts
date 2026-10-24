/** Creates a NEW localhost-only synthetic database; never resets or drops a database. */
import { Client } from 'pg';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { assertLocalTestEnvironment } from './local-safety';

async function main() {
  assertLocalTestEnvironment();
  const source = new URL(process.env.DIRECT_URL!);
  const databaseName = `fixtrack_test_migration_${Date.now()}`;
  const adminUrl = new URL(source); adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try { await admin.query(`CREATE DATABASE "${databaseName}"`); } finally { await admin.end(); }
  source.pathname = `/${databaseName}`;
  const db = new Client({ connectionString: source.toString() });
  await db.connect();
  try {
    await db.query(readFileSync('prisma/migrations/20261022000000_baseline/migration.sql', 'utf8'));
    await db.query(`
      INSERT INTO "User" (id,email,"passwordHash","firstName","lastName","idNumber",role,"accountStatus","updatedAt") VALUES
      ('legacy-user','legacy@example.test','synthetic-not-a-password','Legacy','Requester','legacy-1','STUDENT','ACTIVE',NOW()),
      ('legacy-admin','admin@example.test','synthetic-not-a-password','Legacy','Admin','legacy-2','ADMIN','ACTIVE',NOW()),
      ('legacy-tech','old-tech@example.test','synthetic-not-a-password','Legacy','Technician','legacy-3','TECHNICIAN','ACTIVE',NOW()),
      ('legacy-pending','pending@example.test','synthetic-not-a-password','Legacy','Pending','legacy-4','STUDENT','PENDING',NOW()),
      ('legacy-inactive','inactive@example.test','synthetic-not-a-password','Legacy','Inactive','legacy-5','STUDENT','INACTIVE',NOW());
      INSERT INTO "MaintenanceRequest" (id,"requestCode","submittedById","issueType",building,"roomNumber",description,"urgencyLevel",status,"assignedToId","updatedAt")
      VALUES ('legacy-request','LEGACY-001','legacy-user','PLUMBING','COLLEGE_BUILDING','Library','Original request','URGENT','COMPLETED','legacy-tech',NOW());
      INSERT INTO "RequestAssignment" (id,"requestId","assignedToId","assignedById") VALUES ('legacy-assignment','legacy-request','legacy-tech','legacy-admin');
      INSERT INTO "RequestStatusHistory" (id,"requestId","changedById","newStatus",remarks) VALUES ('legacy-status','legacy-request','legacy-tech','COMPLETED','Original history');
      INSERT INTO "RepairNote" (id,"requestId","technicianId",notes,"updatedAt") VALUES ('legacy-note','legacy-request','legacy-tech','Original repair note',NOW());
      INSERT INTO "Notification" (id,"userId",type,title,message,"requestId") VALUES ('legacy-notification','legacy-user','TASK_COMPLETED','Original title','Original message','legacy-request');
      INSERT INTO "AuditLog" (id,"userId",action,details) VALUES ('legacy-audit','legacy-admin','TASK_ASSIGNED','Original audit');
      INSERT INTO "SystemSettings" (id,key,value,"updatedAt") VALUES ('legacy-setting','original-setting','Original value',NOW());
    `);
    const tables = ['User','MaintenanceRequest','RequestAssignment','RequestStatusHistory','RepairNote','Notification','AuditLog','SystemSettings'];
    const columns: Record<string, string[]> = {};
    const before: Record<string, unknown> = {};
    for (const table of tables) {
      columns[table] = (await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position', ['public', table])).rows.map(r => r.column_name);
      before[table] = (await db.query(`SELECT ${columns[table].map(c => `"${c}"`).join(',')} FROM "${table}" ORDER BY id`)).rows;
    }
    await db.query('BEGIN');
    await db.query(readFileSync('prisma/migrations/20261022000100_official_request_form/migration.sql', 'utf8'));
    await db.query(readFileSync('prisma/migrations/20261022000200_registration_id_document/migration.sql', 'utf8'));
    await db.query(readFileSync('prisma/migrations/20261022000300_account_verification_decisions/migration.sql', 'utf8'));
    await db.query(readFileSync('prisma/migrations/20261022000400_optional_registration_id_number/migration.sql', 'utf8'));
    await db.query(readFileSync('prisma/migrations/20261023000000_worker_directory/migration.sql', 'utf8'));
    await db.query(readFileSync('prisma/migrations/20261024000000_server_only_tables/migration.sql', 'utf8'));
    await db.query(`INSERT INTO "MaintenanceWorker" (id,name,"contactNumber","createdById","updatedAt") VALUES ('old-worker','Synthetic existing worker','09000000000','legacy-tech',NOW());
      INSERT INTO "TaskWorkerAssignment" (id,"requestId","workerId","recordedById","workerName","contactNumber",specialization) VALUES ('old-worker-assignment','legacy-request','old-worker','legacy-tech','Original worker snapshot','09000000000','GENERAL');`);
    const workerBefore = (await db.query('SELECT * FROM "MaintenanceWorker" ORDER BY id')).rows;
    const assignmentBefore = (await db.query('SELECT * FROM "TaskWorkerAssignment" ORDER BY id')).rows;
    await db.query(readFileSync('prisma/migrations/20261025000000_request_worker_ratings/migration.sql', 'utf8'));
    assert.deepEqual((await db.query('SELECT * FROM "MaintenanceWorker" ORDER BY id')).rows,workerBefore);
    assert.deepEqual((await db.query('SELECT * FROM "TaskWorkerAssignment" ORDER BY id')).rows,assignmentBefore);
    await db.query('COMMIT');
    for (const table of tables) {
      const after = (await db.query(`SELECT ${columns[table].map(c => `"${c}"`).join(',')} FROM "${table}" ORDER BY id`)).rows;
      assert.deepEqual(after, before[table], `${table}: legacy values changed`);
    }
    const request = (await db.query('SELECT "requestDate","requestingParty","workLocation","requestedPriority" FROM "MaintenanceRequest" WHERE id=$1', ['legacy-request'])).rows[0];
    assert.deepEqual(request, { requestDate: null, requestingParty: null, workLocation: null, requestedPriority: null });
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "User" WHERE "registrationIdPath" IS NOT NULL')).rows[0].total, 0);
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "User" WHERE "verificationRejectionReason" IS NOT NULL')).rows[0].total, 0);
    const statuses = (await db.query("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid=pg_type.oid WHERE pg_type.typname='AccountStatus'")).rows.map(row => row.enumlabel);
    assert.ok(statuses.includes('REJECTED'));
    for (const id of ['no-number-1', 'no-number-2']) {
      await db.query('INSERT INTO "User" (id,email,"passwordHash","firstName","lastName",role,"accountStatus","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())', [id, `${id}@example.test`, 'synthetic', 'No', 'Number', 'STUDENT', 'PENDING']);
    }
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "User" WHERE "idNumber" IS NULL')).rows[0].total, 2);
    await assert.rejects(() => db.query('UPDATE "User" SET "idNumber"=$1 WHERE id=$2', ['legacy-1', 'no-number-1']));
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "MaintenanceWorker"')).rows[0].total, 1);
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "TaskWorkerAssignment"')).rows[0].total, 1);
    const secured = (await db.query("SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('MaintenanceWorker','TaskWorkerAssignment')")).rows;
    assert.equal(secured.length, 2); assert.ok(secured.every(row => row.relrowsecurity));
    assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM pg_policies WHERE schemaname='public' AND tablename IN ('MaintenanceWorker','TaskWorkerAssignment')")).rows[0].total, 0);
    const privateTables=(await db.query("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='public' AND relname=ANY($1::text[])",[tables])).rows;
    assert.equal(privateTables.length,8);assert.ok(privateTables.every(row=>row.relrowsecurity));
    const readerRole=`fixtrack_test_reader_${Date.now()}`;
    await db.query(`CREATE ROLE "${readerRole}" NOLOGIN`);
    await db.query(`GRANT USAGE ON SCHEMA public TO "${readerRole}"`);
    await db.query(`INSERT INTO "RequestRating" (id,"requestId","ratedById",score,"updatedAt") VALUES ('synthetic-rating','legacy-request','legacy-user',4,NOW());
      INSERT INTO "WorkerRating" (id,"requestId","workerId","ratedById",score,"updatedAt") VALUES ('synthetic-worker-rating','legacy-request','old-worker','legacy-user',3,NOW());`);
    await db.query(`GRANT SELECT ON "User", "RequestRating", "WorkerRating" TO "${readerRole}"`);
    await db.query('BEGIN');await db.query(`SET LOCAL ROLE "${readerRole}"`);
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM "User"')).rows[0].total,0);
    const ratingTables = (await db.query("SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('RequestRating','WorkerRating')")).rows;
    assert.equal(ratingTables.length,2); assert.ok(ratingTables.every(row=>row.relrowsecurity));
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM \"RequestRating\"')).rows[0].total,0);
    assert.equal((await db.query('SELECT COUNT(*)::int AS total FROM \"WorkerRating\"')).rows[0].total,0);
    await db.query('COMMIT');
    console.log('PASS: all original columns/rows across 8 models plus existing workers/assignments preserved; server-only RLS blocks an unprivileged reader even with SELECT granted.');
  } finally { await db.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
