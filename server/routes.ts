import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, CommentOnPost, Friending, LikeOnPost, Posting, Sessioning } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { z } from "zod";
import { CommentOptions } from "./concepts/commenting";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getByAuthor(id);
    } else {
      posts = await Posting.getPosts();
    }
    posts =await Responses.posts(posts); 
    let newPosts = [];
    for(let post of posts){
      let numLikes = await LikeOnPost.getNumLikes(post._id);
      let comments = await CommentOnPost.getByItem(post._id);
      newPosts.push({...post, likes:numLikes, comments:comments});
    }
    return newPosts;
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const created = await Posting.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user);
    return Posting.delete(oid);
  }

  @Router.get("/posts/:pid/comments")
  @Router.validate(z.object({pid: z.string()}))
  async getCommentsOnPosts(pid:string) {
    let comments;
    const id = new ObjectId(pid);
    comments = await CommentOnPost.getByItem(id);

    return Responses.comments(comments);
  }
  @Router.post("/posts/:pid/comments")
  async createCommentOnPost(session: SessionDoc, pid: string, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    const itemID = new ObjectId(pid);
    await Posting.assertPostExists(itemID);//check if that post exists!
    const created = await CommentOnPost.create(itemID, user, content, options);
    return { msg: created.msg, comment: await Responses.comment(created.comment) };
  }
  @Router.patch("/posts/:pid/comments/:id")
  async updateCommentOnPost(session: SessionDoc, id: string, content?: string, options?: CommentOptions) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await CommentOnPost.assertAuthorIsUser(oid, user);
    return await CommentOnPost.update(oid, content, options);
  }

  @Router.delete("/posts/:pid/comments/:id")
  async deleteCommentOnPost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await CommentOnPost.assertAuthorIsUser(oid, user);
    return CommentOnPost.delete(oid);
  }

  @Router.get("/users/:username/likes")
  async getLikes(username: string) {
    const id = (await Authing.getUserByUsername(username))._id;
    return await LikeOnPost.getLikesByUser(id);
  }

  @Router.get("/posts/:pid/likes")
  async getNumLikesOnPost(pid:string){
    return await LikeOnPost.getNumLikes(new ObjectId(pid));
  }

  @Router.post("/posts/:pid/likes")
  async addLikeOnPost(session:SessionDoc, pid:string){
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(pid);
    await Posting.assertPostExists(oid);//check if that post exists!
    const liked = await LikeOnPost.addLike(oid, user);
    return { msg: liked.msg, like: await Responses.like(liked.like)};
  }

  @Router.delete("/posts/:pid/likes")
  async removeLikeOnPost(session:SessionDoc, pid:string){
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(pid);
    await Posting.assertPostExists(oid);//check if that post exists!
    return await LikeOnPost.removeLike(oid, user);
  }


  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
