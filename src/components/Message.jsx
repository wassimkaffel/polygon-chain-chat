import React from "react";

// This is a functional component which renders the individual messages
export function Message(props) {
  return (
    <>
      {props.sender === "You" ? (
        <div className="youchatitem">
          <div>
            <p>{props.timeStamp}</p>
            <div>{props.data}</div>
          </div>
        </div>
      ) : (
        <div className="otherchatitem">
          <div>
            <div className={props.backcolor}>
              {props.sender.substr(0, 2).toUpperCase()}
            </div>
            <div>
              <p>
                {props.sender}, {props.timeStamp}
              </p>
              <div>{props.data}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
