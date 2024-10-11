import AuthenticatingConcept from "./concepts/authenticating";
import CommentingConcept from "./concepts/commenting";
import CorrectnessVotingConcept from "./concepts/correctnessvoting";
import FriendingConcept from "./concepts/friending";
import LikeConcept from "./concepts/liking";
import PostingConcept from "./concepts/posting";
import ProfessionalVerifyingConcept from "./concepts/professionalverifying";
import SessioningConcept from "./concepts/sessioning";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
export const CommentOnPost = new CommentingConcept("comments_on_posts");
export const LikeOnPost = new LikeConcept("likes_on_posts");
export const VoteOnPost = new CorrectnessVotingConcept("votes_on_posts");
export const ProfessionalVerifying = new ProfessionalVerifyingConcept("verifications");