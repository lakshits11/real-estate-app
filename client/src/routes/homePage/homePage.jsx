import React, { useContext } from "react";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";

function HomePage() {
  const { currentUser } = useContext(AuthContext);

  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <h1 className="title">Find Your Dream Space Today</h1>
          <p>
            Whether you're searching for a cozy home, modern office space, or
            luxurious villa, we make it easy to find the perfect place that
            suits your needs. Start your journey now!
          </p>
          <SearchBar />
          <div className="boxes">
            <div className="box">
              <h1>10+</h1>
              <h2>Years of Experience</h2>
            </div>
            <div className="box">
              <h1>100+</h1>
              <h2>Awards Gained</h2>
            </div>
            <div className="box">
              <h1>6000+</h1>
              <h2>Ready Properties</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default HomePage;
