import { Job } from "./Job";

export interface Report{
    jobQueue: Job[];
    data?: any;
}
