import "./listPage.scss";
import Filter from "../../components/filter/Filter";
import Card from "../../components/card/Card";
import Map from "../../components/map/Map";
import { Await, useLoaderData } from "react-router-dom";
import { Suspense } from "react";

function ListPage() {
  const { postResponse } = useLoaderData();
  console.log("postResponse: ", postResponse);
  

  return (
    <div className="listPage">
      <div className="listContainer">
        <div className="wrapper">
          <Filter />
          <Suspense fallback={<div>Loading posts...</div>}>
            <Await
              resolve={postResponse}
              errorElement={<div>Error loading posts!</div>}
            >
              {(response) => {
                console.log("Response from API:", response);
                if (!response?.data?.data) return <div>No posts found</div>;
                return response.data.data.map((post) => (
                  <Card key={post.id} item={post} />
                ));
              }}
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="mapContainer">
        <Suspense fallback={<div>Loading map...</div>}>
          <Await
            resolve={postResponse}
            errorElement={<div>Error loading map data!</div>}
          >
            {(response) => {
              if (!response?.data?.data) return <div>No map data</div>;
              return <Map items={response.data.data} />;
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}

export default ListPage;
