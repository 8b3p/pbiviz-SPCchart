import * as React from 'react';

interface props {
  message?: string;
}

const NoData = ({ message }: props) => {
  return <div className="container">
    <h1>{message || "No Data"}</h1>
  </div>;
};

export default NoData;
