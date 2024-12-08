import { useState } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate } from "react-router-dom";
import Slider from "../../components/slider/Slider";

function NewPostPage() {
  const [value, setValue] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    try {
      const res = await apiRequest.post("/posts", {
        postdata: {
          title: inputs.title,
          price: parseInt(inputs.price),
          address: inputs.address,
          city: inputs.city,
          room: parseInt(inputs.room),
          bathroom: parseInt(inputs.bathroom),
          type: inputs.type,
          property: inputs.property,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
          images: images,
        },
        postdetails: {
          description: value,
          utilities: inputs.utilities,
          pet: inputs.pet === "true",
          income: inputs.income,
          size: parseInt(inputs.size),
          hospital: parseInt(inputs.hospital),
          airport: parseInt(inputs.airport),
          mall: parseInt(inputs.mall),
        },
      });
      // res.data.data.id: postId
      navigate("/posts/" + res.data.data.id);
    } catch (err) {
      console.log(err);
      setError(error);
    }
  };

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <h1>Create New Post</h1>
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" />
            </div>
            <div className="item">
              <label htmlFor="price">Price</label>
              <input id="price" name="price" type="number" min={1} />
            </div>
            <div className="item">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" />
            </div>
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill
                theme="snow"
                onChange={setValue}
                value={value}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    [{ align: [] }],
                    ["blockquote"],
                    ["clean"],
                  ],
                }}
              />
            </div>
            <div className="item">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" />
            </div>
            <div className="item">
              <label htmlFor="room">Number of Rooms</label>
              <input min={1} id="room" name="room" type="number" />
            </div>
            <div className="item">
              <label htmlFor="bathroom">Number of Bathrooms</label>
              <input min={1} id="bathroom" name="bathroom" type="number" />
            </div>
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="text" />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="text" />
            </div>
            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type">
                <option value="rent" defaultChecked>
                  Rent
                </option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Property</label>
              <select name="property">
                <option value="apartment" defaultChecked>
                  Apartment
                </option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="villa">Villa</option>
                <option value="office">Office</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities">
                <option value="owner">Owner is responsible</option>
                <option value="tenant">Tenant is responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet">
                <option value="true">Allowed</option>
                <option value="false">Not Allowed</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input
                id="income"
                name="income"
                type="text"
                placeholder="Income Policy"
              />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input min={0} id="size" name="size" type="number" />
            </div>
            <div className="item">
              <label htmlFor="hospital">Distance to Hospital (km)</label>
              <input min={0} id="hospital" name="hospital" type="number" />
            </div>
            <div className="item">
              <label htmlFor="airport">Distance to Airport (km)</label>
              <input min={0} id="airport" name="airport" type="number" />
            </div>
            <div className="item">
              <label htmlFor="mall">Distance to Mall (km)</label>
              <input min={0} id="mall" name="mall" type="number" />
            </div>
            <button className="sendButton">Add</button>
            {error && <span>error</span>}
          </form>
        </div>
      </div>
      <div className="sideContainer">
        <div className="imageContainer">
          {imageIndex !== null ? (
            <Slider images={images} />
          ) : (
            <div className="imageList">
              {images.slice(0, 4).map((image, index) => (
                <div
                  key={index}
                  className={`imageWrapper ${
                    index === 3 && images.length > 4 ? "extraImages" : ""
                  }`}
                  onClick={() => setImageIndex(0)}
                >
                  <img src={image} alt="" />
                  {index === 3 && images.length > 4 && (
                    <div className="overlay">+{images.length - 4} images</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="uploadContainer">
          <UploadWidget
            uwConfig={{
              multiple: true,
              cloudName: "lamadev",
              uploadPreset: "estate",
              folder: "posts",
            }}
            setState={setImages}
          />
        </div>
      </div>
    </div>
  );
}

export default NewPostPage;
