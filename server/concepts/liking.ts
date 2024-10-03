import { ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";


export interface LikeDoc extends BaseDoc {
  item: ObjectId;
  liker: ObjectId;
}
/**
 * concept: Liking [Item, User]
 */
export default class LikeConcept {
    public readonly likes: DocCollection<LikeDoc>;

    /**
   * Make an instance of Like.
   */
  constructor(collectionName: string) {
    this.likes = new DocCollection<LikeDoc>(collectionName);
  }
  async addLike(item:ObjectId, liker:ObjectId){
    if(await this.checkLikeExists(item,liker)){
        throw new NotAllowedError('User already liked this item');
    }
    const _id = await this.likes.createOne({ item,liker });
    return { msg: "Like successfully added to item: "+item, like: await this.likes.readOne({ _id }) };
  }
  
  async removeLike(item:ObjectId, liker:ObjectId){
    if(!(await this.checkLikeExists(item,liker))){
        throw new NotAllowedError("User hasn't liked this item!");
    }
    const _id = await this.likes.readOne({ item,liker });
    if(_id){
        await this.likes.deleteOne({ item,liker });
        return { msg: "Like successfully removed from item: "+item};
    }
    
  }

  async getNumLikes(item:ObjectId){
    const likes = await this.likes.readMany({ item });
    if(likes===null) 
        return 0;
    else
        return likes.length;
  }

  async getLikesByUser(liker:ObjectId){
    return await this.likes.readMany({ liker });
  }

  async checkLikeExists(item:ObjectId,liker:ObjectId){
    const like = await this.likes.readOne({item:item, liker:liker})
    if(!like){
        return false;
    }
    return true;
  }

}