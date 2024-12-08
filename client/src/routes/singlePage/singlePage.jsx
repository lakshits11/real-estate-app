import "./singlePage.scss";
import Slider from "../../components/slider/Slider";
import Map from "../../components/map/Map";
import { useNavigate, useLoaderData } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function SinglePage() {
  const post = useLoaderData();
  console.log(post);

  const [saved, setSaved] = useState(post.isSaved || false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/login");
    }
    setSaved((prev) => !prev); // toggles the previous state (saved=>unsaved and vice versa)
    try {
      // makes a post request to "/users/savepost" and send postId in request body
      await apiRequest.post("/users/savepost", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  return (
    <div className="singlePage">
      <div className="details">
        <div className="wrapper">
          <Slider images={post.images || []} />
          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{post.address}</span>
                </div>
                <div className="price">$ {post.price}</div>
              </div>
              <div className="user">
                <img src={post.user?.avatar || "/noavatar.jpg"} alt="" />
                <span>{post.user?.username}</span>
              </div>
            </div>
            <div
              className="bottom"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.postdetails?.description || ""),
              }}
            ></div>
          </div>
        </div>
      </div>
      <div className="features">
        <div className="wrapper">
          <p className="title">General</p>
          <div className="listVertical">
            <div className="feature">
              <img src="/utility.png" alt="" />
              <div className="featureText">
                <span>Utilities</span>
                {post.postdetails?.utilities === "owner" ? (
                  <p>Owner is responsible</p>
                ) : post.postdetails?.utilities === "tenant" ? (
                  <p>Tenant is responsible</p>
                ) : (
                  <p>Shared</p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Pet Policy</span>
                {post.postdetails?.pet ? (
                  <p>Pets Allowed</p>
                ) : (
                  <p>Pets not Allowed</p>
                )}
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Income Policy</span>
                <p>{post.postdetails?.income}</p>
              </div>
            </div>
          </div>
          <p className="title">Sizes</p>
          <div className="sizes">
            <div className="size">
              <img src="/size.png" alt="" />
              <span>{post.postdetails?.size} sqft</span>
            </div>
            <div className="size">
              <img src="/bed.png" alt="" />
              <span>{post.room} beds</span>
            </div>
            <div className="size">
              <img src="/bath.png" alt="" />
              <span>{post.bathroom} bathroom</span>
            </div>
          </div>
          <p className="title">Nearby Places</p>
          <div className="listHorizontal">
            <div className="feature">
              <img src="/hospital.svg" alt="" />
              <div className="featureText">
                <span>Hospital</span>
                <p>
                  {post.postdetails?.hospital > 999
                    ? post.postdetails?.hospital / 1000 + " km "
                    : post.postdetails?.hospital + " km "}
                  away
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/airport.svg" alt="" />
              <div className="featureText">
                <span>Airport</span>
                <p>
                  {post.postdetails?.airport > 999
                    ? post.postdetails?.airport / 1000 + " km "
                    : post.postdetails?.airport + " km "}
                  away
                </p>
              </div>
            </div>
            <div className="feature">
              <img src="/mall.svg" alt="" />
              <div className="featureText">
                <span>Mall</span>
                <p>
                  {post.postdetails?.mall > 999
                    ? post.postdetails?.mall / 1000 + " km "
                    : post.postdetails?.mall + " km "}
                  away
                </p>
              </div>
            </div>
          </div>
          <p className="title">Location</p>
          <div className="mapContainer">
            <Map items={[post]} />
          </div>
          <div className="buttons">
            <button>
              <img src="/chat.png" alt="" />
              Send a Message
            </button>
            <button onClick={handleSave}>
              <img src={saved ? "/saved.svg" : "/unsaved.svg"} alt="save" />
              {saved ? "Place Saved" : "Save the Place"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SinglePage;
