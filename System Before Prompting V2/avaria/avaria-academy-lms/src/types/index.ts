export interface Trainee {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  dataVersion: number;
}

export interface Batch {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  dataVersion: number;
}

export interface Attendance {
  id: string;
  traineeId: string;
  batchId: string;
  date: Date;
  status: 'Present' | 'Absent' | 'Late';
  createdAt: Date;
  updatedAt: Date;
  dataVersion: number;
}

export interface Assessment {
  id: string;
  batchId: string;
  title: string;
  description: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  dataVersion: number;
}