import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";


export interface VoteDoc extends BaseDoc {
  item: ObjectId;
  voter: ObjectId;
  voteType:boolean;
}
/**
 * concept: CorrectnessVoting [Item, User]
 */
export default class CorrectnessVotingConcept {
    public readonly votes: DocCollection<VoteDoc>;

    /**
     * Make an instance of Vote.
     */
    constructor(collectionName: string) {
        this.votes = new DocCollection<VoteDoc>(collectionName);
    }

    async voteCorrect(item:ObjectId, voter:ObjectId){
        let msg = "";
        const vote = await this.votes.readOne({item:item, voter:voter})
        if(vote && vote.voteType==true){
            throw new NotAllowedError('User already voted "correct" on this item');
        }
        else if(vote){
            msg+= (await this.removeVote(item,voter))?.msg+" and ";
        }
        const _id = await this.votes.createOne({ item,voter, voteType:true });
        return { msg: msg+"Successfully voted correct on item: "+item, vote: await this.votes.readOne({ _id }) };
    }
    
    async voteIncorrect(item:ObjectId, voter:ObjectId){
        let msg = "";
        const vote = await this.votes.readOne({item:item, voter:voter})
        if(vote && vote.voteType==false){
            throw new NotAllowedError('User already voted "incorrect" on this item');
        }
        else if(vote){
            msg+= (await this.removeVote(item,voter))?.msg+" and ";
        }
        const _id = await this.votes.createOne({ item,voter, voteType:false });
        return { msg: msg+"Successfully voted incorrect on item: "+item, vote: await this.votes.readOne({ _id }) };
    }
    async removeVote(item:ObjectId, voter:ObjectId){
        if(!(await this.checkVoteExists(item,voter))){
            throw new NotAllowedError("User hasn't voted on this item!");
        }
        const _id = await this.votes.readOne({ item,voter });
        if(_id){
            await this.votes.deleteOne({ item,voter });
            return { msg: "Vote successfully removed from item: "+item};
        }
        
    }

    //returns numcorrect, numincorrect
    async getCorrectnessVotes(item:ObjectId){
        const votes = await this.votes.readMany({ item });
        if(votes===null) 
            return [0,0];
        else{
            let numCorrect = 0;
            let numIncorrect = 0;
            for(let vote of votes){
                if(vote.voteType) numCorrect++;
                else numIncorrect++;
            }
            return {"Correct Votes":numCorrect,"Incorrect Votes": numIncorrect};
        }
    }


    async checkVoteExists(item:ObjectId,voter:ObjectId){
        const vote = await this.votes.readOne({item:item, voter:voter})
        if(!vote){
            return false;
        }
        return true;
    }

}