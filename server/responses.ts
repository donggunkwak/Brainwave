import { Authing } from "./app";
import { CommentDoc } from "./concepts/commenting";
import { VoteDoc } from "./concepts/correctnessvoting";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { LikeDoc } from "./concepts/liking";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/posting";
import { RequestVerifyDoc, VerificationDoc } from "./concepts/professionalverifying";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await Authing.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
  * Convert CommentDoc into more readable format for the frontend by converting the author id into a username.
  */
  static async comment(comment: CommentDoc | null) {
    if (!comment) {
      return comment;
    }
    const author = await Authing.getUserById(comment.author);
    return { ...comment, author: author.username };
  }

  /**
   * Same as {@link comment} but for an array of CommentDoc for improved performance.
   */
  static async comments(comments: CommentDoc[]) {
    const authors = await Authing.idsToUsernames(comments.map((comment) => comment.author));
    return comments.map((comment, i) => ({ ...comment, author: authors[i] }));
  }

  
   /**
  * Convert LikeDoc into more readable format for the frontend by converting the author id into a username.
  */
   static async like(like: LikeDoc | null) {
    if (!like) {
      return like;
    }
    const liker = await Authing.getUserById(like.liker);
    return { ...like, liker: liker.username };
  }

  /**
   * Same as {@link like} but for an array of LikeDoc for improved performance.
   */
  static async likes(likes: LikeDoc[]) {
    const likers = await Authing.idsToUsernames(likes.map((like) => like.liker));
    return likes.map((like, i) => ({ ...like, liker: likers[i] }));
  }


   /**
  * Convert VoteDoc into more readable format for the frontend by converting the author id into a username.
  */
   static async vote(vote: VoteDoc | null) {
    if (!vote) {
      return vote;
    }
    const voter = await Authing.getUserById(vote.voter);
    return { ...vote, voter: voter.username };
  }

  /**
  * Convert VerificationDoc into more readable format for the frontend by converting the author id into a username.
  */
  static async verification(verification: VerificationDoc | null) {
    if (!verification) {
      return verification;
    }
    const user = await Authing.getUserById(verification.user);
    const approver = await Authing.getUserById(verification.approver);
    return { ...verification, user: user.username, approver:approver.username };
  }

  /**
   * Same as {@link verification} but for an array of VerificationDoc for improved performance.
   */
  static async verifications(verifications: VerificationDoc[]) {
    const users = await Authing.idsToUsernames(verifications.map((verification) => verification.user));
    const approvers = await Authing.idsToUsernames(verifications.map((verification) => verification.approver));
    return verifications.map((verification, i) => ({ ...verification, user: users[i], approver:approvers[i] }));
  }

  /**
  * Convert RequestVerifyDoc into more readable format for the frontend by converting the author id into a username.
  */
  static async requestverify(request: RequestVerifyDoc | null) {
    if (!request) {
      return request;
    }
    const user = await Authing.getUserById(request.user);
    return { ...request, user: user.username };
  }
  /**
   * Same as {@link requestverify} but for an array of RequestVerifyDoc for improved performance.
   */
  static async requestverifys(requests: RequestVerifyDoc[]) {
    const users = await Authing.idsToUsernames(requests.map((request) => request.user));
    return requests.map((request, i) => ({ ...request, user: users[i] }));
  }
  


  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await Authing.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
