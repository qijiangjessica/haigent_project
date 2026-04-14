import { SOURCING_ROLES } from "@/data/sourcing/roles";                                                                                                
import type { SourcingRole } from "@/types";                                                                                                                                                                                                                                                                    
export interface ReferenceJob {    
    id: string;         
    title: string;  
    department: string;   
    location: string;
    companyName: string;           
    status: "OPEN" | "ON_HOLD" | "CLOSED";   
    requiredSkills: string[];
    experienceMin: number;
    experienceMax: number;
    salaryRange: string;  
    description: string;
    createdAt: string;    
    referralCount: number; 
}

function parseExperience(raw: string): { min: number; max: number } {
    // Handles "7-10 years", "5-7 years", "3+ years", "10+ years"
    const rangeMatch = raw.match(/(\d+)-(\d+)/);       
    if (rangeMatch) {                                                                                                                                    
        return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
    }                                                                                                                                                    
    const minOnlyMatch = raw.match(/(\d+)\+/);                                                                                                           
    if (minOnlyMatch) {
        return { min: parseInt(minOnlyMatch[1]), max: parseInt(minOnlyMatch[1]) + 5 };
    }
    return { min: 0, max: 99 };                                                                                                                          
  }                                                                                                                                                      
                                                                                                                                                         
function mapStatus(status: SourcingRole["status"]): ReferenceJob["status"] { 
    switch (status) {
      case "active": return "OPEN";                                                                                                                      
      case "paused": return "ON_HOLD";                                                                                                                   
      case "closed": return "CLOSED";
    }
  }

export const REFERENCE_JOBS: ReferenceJob[] = SOURCING_ROLES.map((role) => {   
    const { min, max } = parseExperience(role.experienceRequired);
    return {                                                                                                                                             
        id: role.id,  
        title: role.title,
        department: role.department,                     
        location: role.location,                                                
        companyName: role.companyName,
        status: mapStatus(role.status),
        requiredSkills: role.skills,
        experienceMin: min,
        experienceMax: max,
        salaryRange: role.salaryRange,           
        description: role.description,                    
        createdAt: role.createdAt,
        referralCount: 0,
    }; 
});
                                                                                                                                                         
export const OPEN_JOBS = REFERENCE_JOBS.filter((j) => j.status === "OPEN");