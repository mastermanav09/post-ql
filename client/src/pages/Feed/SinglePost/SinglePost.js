import React, { Component } from "react";

import Image from "../../../components/Image/Image";
import "./SinglePost.css";

class SinglePost extends Component {
  state = {
    title: "",
    author: "",
    date: "",
    image: "",
    content: "",
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;

    const graphqlQuery = {
      query: `
        query FetchSinglePost($postId : ID!){
          getPost(postId : $postId){
            title
            creator{
              name
            }
            content
            imageUrl
            createdAt
          }
        }
      `,

      variables: {
        postId: postId,
      },
    };

    fetch(`/graphql`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (
          resData.errors &&
          (resData.errors[0].statusCode === 401 ||
            resData.errors[0].statusCode === 404)
        ) {
          throw new Error(resData.errors[0].message);
        }
        this.setState({
          title: resData.data.getPost.title,
          author: resData.data.getPost.creator.name,
          image: "/" + resData.data.getPost.imageUrl, // newly added
          date: new Date(resData.data.getPost.createdAt).toLocaleDateString(
            "en-US"
          ),
          content: resData.data.getPost.content,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <div className="single_post__title">
          <h1>{this.state.title}</h1>
        </div>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
