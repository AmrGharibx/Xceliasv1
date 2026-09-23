/** RED Academy v3. Native records are validated more strictly than imported history. */
export type UUID=string;
export type NotionID=string;
export type ISODate=string;
export type Timestamp=string;
export type UserRole='admin'|'instructor'|'viewer';
export type BatchStatus='Planning'|'Active'|'Completed';
export type AttendanceStatus='Present'|'Absent'|'Tour Day'|'Off Day';
export type EnrollmentStatus='Active'|'Stopped Attending';
export type AssessmentOutcome='Failed'|'Needs Improvement'|'Good'|'Very Good'|'Excellent'|'Aced';
export type ReportKind='template'|'ai'|'notion';
export interface Versioned {id:UUID;version:number;created_at:Timestamp;updated_at:Timestamp;}
export interface Imported {
 source_id:NotionID|null;
 source_meta:{[key:string]:unknown;membership_basis?:'trainee_master'|'named_record'|'record_relation';date_basis?:string;assessment_state?:string;master_trainee_id?:UUID;master_batch_id?:UUID;evidence_source_ids?:NotionID[];};
}
export interface Company extends Versioned,Imported {name:string;}
export interface Batch extends Versioned,Imported {
 batch_name:string;status:BatchStatus|null;start_date:ISODate|null;end_date:ISODate|null;
 session_dates:ISODate[];capacity:number|null;description:string;archived_at:Timestamp|null;archived_by:string|null;
}
/** One batch enrollment, not a claim that every row is a distinct person. */
export interface Trainee extends Versioned,Imported {
 trainee_name:string;company_id:UUID|null;batch_id:UUID|null;email:string;phone:string;job_title:string;notes:string;enrollment_status:EnrollmentStatus;
}
export interface DailyAttendance extends Versioned,Imported {
 trainee_id:UUID|null;batch_id:UUID|null;date:ISODate|null;arrival_time:Timestamp|null;departure_time:Timestamp|null;
 status:AttendanceStatus|null;is_late:boolean;assessment_day:boolean;absence_reason:string;analytics_included:boolean;
}
export type TenDays=[boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean];
export interface Attendance10Day extends Versioned,Imported {
 trainee_id:UUID|null;batch_id:UUID|null;period_start:ISODate|null;period_end:ISODate|null;
 days:TenDays;report:string;report_kind:ReportKind;
}
export interface Assessment extends Versioned,Imported {
 trainee_id:UUID|null;batch_id:UUID|null;company_id:UUID|null;assessment_title:string;
 mapping:number|null;product_knowledge:number|null;presentability:number|null;soft_skills:number|null;
 assessment_outcome:AssessmentOutcome|null;recorded_attendance:number|null;recorded_absence:number|null;
 analytics_included:boolean;instructor_comment:string;report:string;report_kind:ReportKind;
}
export interface Scores {tech:number|null;soft:number|null;overall:number|null;}
export interface AttendanceStats {present:number;absent:number;tour:number;off:number;late:number;calculatedLate:number;rate:number|null;}
export interface AssessmentRevision {id:UUID;assessment_id:UUID|null;trainee_id:UUID|null;actor:string;snapshot:Assessment;created_at:Timestamp;}
export interface AuditEntry {id:UUID;actor:string;action:string;entity:string;entity_id:UUID|null;details:string;created_at:Timestamp;}
export interface User {id:UUID;email:string;full_name:string;role:UserRole;active:boolean;}
export type SourceDisposition='imported'|'consolidated'|'excluded_empty'|'excluded_demo';
export interface SourceRecord {
 id:NotionID;import_id:UUID;kind:'batches'|'trainees'|'daily'|'checklists'|'assessments';title:string;path:string;
 sha256:string;raw:string;properties:Record<string,string>;relations:Record<string,NotionID[]>;
 batch_id:UUID|null;disposition:SourceDisposition;reason:string;app_records:{table:MasterTable;id:UUID}[];
}
export interface ImportReview {id:UUID;code:string;batch_id:UUID|null;entity:string|null;entity_id:UUID|null;source_ids:NotionID[];message:string;status:'open'|'acknowledged'|'resolved';resolution:string;updated_at:Timestamp;}
export interface ImportRun {id:UUID;source_name:string;source_sha256:string;imported_at:Timestamp;summary:Record<string,unknown>;}
export interface WorkspaceState {
 companies:Company[];batches:Batch[];trainees:Trainee[];daily_attendance:DailyAttendance[];
 attendance_10day:Attendance10Day[];assessments:Assessment[];assessment_history:AssessmentRevision[];
 audit_log:AuditEntry[];import_reviews:ImportReview[];import_runs:ImportRun[];
}
export type MasterTable='companies'|'batches'|'trainees'|'daily_attendance'|'attendance_10day'|'assessments';
export type Mutation<T>={table:MasterTable;action:'create';data:T}|{table:MasterTable;action:'update';id:UUID;expectedVersion:number;data:T}|{table:MasterTable;action:'delete';id:UUID;expectedVersion:number};
