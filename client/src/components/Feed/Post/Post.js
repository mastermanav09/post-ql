import React from "react";

import Button from "../../Button/Button";
import "./Post.css";

function Post(props) {
  let readMore = props.title;
  let readMoreCont = "";

  if (props.title.length > 100) {
    readMoreCont = (
      <span
        style={{
          color: "black",
          fontSize: "0.8rem",
          fontStyle: "italic",
          backgroundColor: "#7d628f",
          padding: "0px 5px",
          borderRadius: "4px",
        }}
      >
        click view to read more
      </span>
    );
    readMore = props.title.substring(0, 70) + "...";
  }
  return (
    <>
      <article className="post">
        <header className="post__header">
          <h3 className="post__meta">
            Posted by {props.author} on {props.date}
          </h3>
          <div className="post_title_div">
            <h2 className="post__title">
              {readMore} {readMoreCont}
            </h2>
          </div>
        </header>
        {/* <div className="post__image">
          <Image imageUrl={props.image} contain />
        </div>
        <div className="post__content">{props.content}</div> */}
        <div className="post__actions">
          <Button mode="flat" link={props.id}>
            View
          </Button>

          <Button mode="flat" onClick={props.onStartEdit}>
            Edit
          </Button>

          <Button mode="flat" design="danger" onClick={props.onDelete}>
            Delete
          </Button>
        </div>
      </article>
    </>
  );
}

export default Post;
