import { Decimal128 } from "typeorm/driver/mongodb/bson.typings.js";

export class FindingDto{
    
    eventId:string;
    sensitiveTypeId:string;
    locationReference:string;
    confidence:Decimal128;
    matchCount:number;
    maskedEvidence:string;
    status:string;
    recemmendation:string;
}