import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";


export interface RequestVerifyDoc extends BaseDoc {
  user: ObjectId;
  requestContent: string;//this is either just an explanation or a link to an image
}
export interface VerificationDoc extends BaseDoc{
    user: ObjectId;
    verificationContent:string;
    approver:ObjectId;
}
/**
 * concept: ProfessionalVerifying [Item, User]
 */
export default class ProfessionalVerifyingConcept {
    public readonly requests: DocCollection<RequestVerifyDoc>;
    public readonly verifiedUsers: DocCollection<VerificationDoc>;
    /**
     * Make an instance of Requests.
     */
    constructor(collectionName: string) {
        this.verifiedUsers =  new DocCollection<VerificationDoc>(collectionName);
        this.requests = new DocCollection<RequestVerifyDoc>(collectionName+"_requests");
        
    }

    async getVerifiedUsers(){
        return await this.verifiedUsers.readMany({}, { sort: { _id: -1 } });
    }

    async getVerifiedUser(user:ObjectId){
        if(!await this.isUserVerified(user)){
            throw new NotFoundError("This User is not verified!");
        }
        return await this.verifiedUsers.readOne({user:user});
    }
    async getRequests(){
        return await this.requests.readMany({}, { sort: { _id: -1 } });
    }

    async submitRequest(user:ObjectId, content:string){
        const _id = await this.requests.createOne({ user, requestContent:content});
        return { msg: "Request successfully created!", request: await this.requests.readOne({ _id }) };
    }

    async acceptRequest(_id:ObjectId, verificationContent:string,approver:ObjectId){
        let request = await this.requests.readOne({_id});
        if(!request){
            throw new NotFoundError("no request found!");
        }
        const verification = await this.verifiedUsers.createOne({user:request.user,verificationContent:verificationContent, 
            approver:approver});

        await this.requests.deleteOne({ _id });

        return { msg: 'Request for '+request?.user+' accepted successfully!',verification: verification};
    }
    async rejectRequest(_id:ObjectId){
        let request = await this.requests.readOne({_id});
        if(!request){
            throw new NotFoundError("no request found!");
        }
        await this.requests.deleteOne({ _id });

        return { msg: 'Request for '+request?.user+' rejected successfully!' };
    }
    async unverifyUser(user:ObjectId){
        let verification=await this.verifiedUsers.readOne({user:user}); 
        if(!verification){
            throw new NotAllowedError("Can't unverify a user that isn't verified!");
        }
        await this.verifiedUsers.deleteOne({user})
        return{msg:'Successfully unverified user: '+user};
    }
    async isUserVerified(user:ObjectId){
        let verification=await this.verifiedUsers.readOne({user:user}); 
        if(verification) return true;
        else return false;
    }

}