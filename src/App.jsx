import React from "react";
import { useState, useEffect } from "react";
import { Container, Form, Button, Modal } from "react-bootstrap";
import { encode, decode } from "string-encode-decode";
import { Message } from "./components/Components.js";
import { ethers } from "ethers";
import { abi } from "./abi";
import Imageurl from "./assets/image/logo/logo.png";

// Add the contract address inside the quotes
const CONTRACT_ADDRESS = "0xb4dec1df0b7f242b601f007988b42b151016bafc";

export function App(props) {
  const [friends, setFriends] = useState(null);
  const [myName, setMyName] = useState(null);
  const [myPublicKey, setMyPublicKey] = useState(null);
  const [activeChat, setActiveChat] = useState({
    friendname: null,
    publicKey: null,
  });
  const [activeChatMessages, setActiveChatMessages] = useState(null);
  const [showConnectButton, setShowConnectButton] = useState("block");
  const [myContract, setMyContract] = useState(null);
  const [inputtext, setInputtext] = useState("");
  const [chats, setChats] = useState(null);

  const [darkmodeflag, setDarkmodeflag] = useState("light");

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Save the contents of abi in a variable
  const contractABI = abi;
  let provider;
  let signer;

  // Login to Metamask and check the if the user exists else creates one
  async function login() {
    let res = await connectToMetamask();
    if (res === true) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      try {
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );
        setMyContract(contract);
        const address = await signer.getAddress();
        let present = await contract.checkUserExists(address);
        let username;
        if (present) username = await contract.getUsername(address);
        else {
          username = prompt("Enter a username", "Guest");
          if (username === "") username = "Guest";
          await contract.createAccount(username);
        }
        setMyName(username);
        setMyPublicKey(address);
        setShowConnectButton("none");
      } catch (err) {
        alert("CONTRACT_ADDRESS not set properly!");
      }
    } else {
      alert("Couldn't connect to Metamask");
    }
  }

  // Check if the Metamask connects
  async function connectToMetamask() {
    try {
      await window.ethereum.enable();
      return true;
    } catch (err) {
      return false;
    }
  }

  // Add a friend to the users' Friends List
  async function addChat(name, publicKey) {
    try {
      let present = await myContract.checkUserExists(publicKey);
      if (!present) {
        alert("Given address not found: Ask him to join the app :)");
        return;
      }
      try {
        await myContract.addFriend(publicKey, name);
        const frnd = { name: name, publicKey: publicKey };
        setFriends(friends.concat(frnd));
      } catch (err) {
        alert(
          "Friend already Added! You can't be friend with the same person twice;"
        );
      }
    } catch (err) {
      alert("Invalid address!");
    }
  }

  // filter chats list
  async function filterchats(e) {
    const filterfriends = !e.target.value.trim()
      ? friends
      : friends.filter((item, key) => {
          return item.name.toLowerCase().indexOf(e.target.value.trim()) > -1;
        });

    setChats(
      filterfriends
        ? filterfriends.map((friend, keys) => {
            return (
              <div
                key={keys}
                className="contact-item"
                onClick={() =>
                  getMessage(
                    friend.publicKey,
                    keys % 3 === 0
                      ? "backredcolor"
                      : keys % 3 === 1
                      ? "backgreencolor"
                      : "backpinkcolor"
                  )
                }
              >
                <div
                  className={
                    keys % 3 === 0
                      ? "backredcolor"
                      : keys % 3 === 1
                      ? "backgreencolor"
                      : "backpinkcolor"
                  }
                >
                  {friend.name.substr(0, 2).toUpperCase()}
                </div>
                <div>
                  <p>{friend.name}</p>
                  <p>
                    {friend.publicKey.substr(0, 7)} ...{" "}
                    {friend.publicKey.substr(38, 42)}
                  </p>
                </div>
              </div>
            );
          })
        : null
    );
  }

  // Sends messsage to an user
  async function sendMessage(data) {
    if (!(activeChat && activeChat.publicKey)) return;
    const recieverAddress = activeChat.publicKey;
    await myContract.sendMessage(recieverAddress, encode(data));
    setInputtext("");
  }

  async function backMenu() {
    document.getElementById("menu-section").style.display = "flex";
    document.getElementById("body-section").style.display = "none";
  }

  // Fetch chat messages with a friend
  async function getMessage(friendsPublicKey, backcolors) {
    const winWidth = window.innerWidth;
    if (winWidth <= 768) {
      document.getElementById("menu-section").style.display = "none";
      document.getElementById("body-section").style.display = "flex";
      let nickname;
      let messages = [];
      friends.forEach((item) => {
        if (item.publicKey === friendsPublicKey) nickname = item.name;
      });
      // Get messages
      const data = await myContract.readMessage(friendsPublicKey);
      data.forEach((item, key) => {
        const timestamp = new Date(1000 * item[1].toNumber()).toUTCString();
        messages.push({
          key: key,
          publicKey: item[0],
          timeStamp: timestamp,
          data: decode(item[2]),
          backcolor: backcolors,
        });
      });
      setActiveChat({ friendname: nickname, publicKey: friendsPublicKey });
      setActiveChatMessages(messages);
    } else {
      let nickname;
      let messages = [];
      friends.forEach((item) => {
        if (item.publicKey === friendsPublicKey) nickname = item.name;
      });
      // Get messages
      const data = await myContract.readMessage(friendsPublicKey);
      data.forEach((item, key) => {
        const timestamp = new Date(1000 * item[1].toNumber()).toUTCString();
        messages.push({
          key: key,
          publicKey: item[0],
          timeStamp: timestamp,
          data: decode(item[2]),
          backcolor: backcolors,
        });
      });
      setActiveChat({ friendname: nickname, publicKey: friendsPublicKey });
      setActiveChatMessages(messages);
    }
  }

  // This executes every time page renders and when myPublicKey or myContract changes
  useEffect(() => {
    async function loadFriends() {
      let friendList = [];
      // Get Friends
      try {
        const data = await myContract.getMyFriendList();
        data.forEach((item) => {
          friendList.push({ publicKey: item[0], name: item[1] });
        });
      } catch (err) {
        friendList = null;
      }
      // Displays each card
      setChats(
        friends
          ? friends.map((friend, keys) => {
              return (
                <div
                  key={keys}
                  className="contact-item"
                  onClick={() =>
                    getMessage(
                      friend.publicKey,
                      keys % 3 === 0
                        ? "backredcolor"
                        : keys % 3 === 1
                        ? "backgreencolor"
                        : "backpinkcolor"
                    )
                  }
                >
                  <div
                    className={
                      keys % 3 === 0
                        ? "backredcolor"
                        : keys % 3 === 1
                        ? "backgreencolor"
                        : "backpinkcolor"
                    }
                  >
                    {friend.name.substr(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p>{friend.name}</p>
                    <p>
                      {friend.publicKey.substr(0, 7)} ...{" "}
                      {friend.publicKey.substr(38, 42)}
                    </p>
                  </div>
                </div>
              );
            })
          : null
      );
      setFriends(friendList);
    }
    loadFriends();
  }, [myPublicKey, myContract]);

  // Makes Cards for each Message
  const Messages = activeChatMessages
    ? activeChatMessages.map((message) => {
        let margin = "5%";
        let sender = activeChat.friendname;
        if (message.publicKey === myPublicKey) {
          margin = "15%";
          sender = "You";
        }
        return (
          <Message
            marginLeft={margin}
            sender={sender}
            data={message.data}
            timeStamp={message.timeStamp}
            backcolor={message.backcolor}
          />
        );
      })
    : null;

  useEffect(() => {
    const node = document.createElement("link");
    node.setAttribute("rel", "stylesheet");
    node.setAttribute("href", "/css/Chat.css");
    node.setAttribute("id", "lightlink");
    document.getElementById("header").append(node);
  }, []);

  useEffect(() => {
    document
      .getElementById("lightlink")
      .setAttribute(
        "href",
        darkmodeflag === "light" ? "/css/Chat.css" : "/css/Chatdark.css"
      );
  }, [darkmodeflag]);

  return (
    <div className="main-section">
      <div className="menu-section" id="menu-section">
        <div className="logo-section">
          <div>
            <img src={Imageurl} alt="logo" />
          </div>
          <div>Polygon Chat App</div>
          <div>
            <div onClick={async () => login()}>
              <img
                src="https://cdn.iconscout.com/icon/free/png-256/metamask-2728406-2261817.png"
                height="20px"
              />
            </div>
          </div>
        </div>
        <div className="contact-section">
          <div className="contact-menu">
            <div className="menu-active active">
              <i className="fa fa-weixin"></i>
            </div>
            <div className="menu-active" onClick={handleShow}>
              <i className="fa fa-user-plus"></i>
            </div>
          </div>
          <div className="contact-body">
            <div className="contact-title">
              <p>Messages</p>
              <div>
                <input
                  type="text"
                  placeholder="Search"
                  onChange={(e) => filterchats(e)}
                />
                <i className="fa fa-search"></i>
              </div>
            </div>
            <div className="contact-content">{chats}</div>
          </div>
        </div>
      </div>
      <div className="body-section" id="body-section">
        <div className="header-section">
          {myName === null ? (
            <div className="header-contact"></div>
          ) : (
            <div className="header-contact">
              <div>{myName.substr(0, 2).toUpperCase()}</div>
              <div>
                <p>{myName}</p>
                <p>{myPublicKey}</p>
              </div>
            </div>
          )}

          {myName === null ? (
            <div className="header-contact-mobile"></div>
          ) : (
            <div className="header-contact-mobile">
              <div onClick={() => backMenu()}>
                <i className="fa fa-arrow-left"></i>
              </div>
              <div>{myName.substr(0, 2).toUpperCase()}</div>
              <div>
                <p>{myName}</p>
                <p>{myPublicKey}</p>
              </div>
            </div>
          )}

          <div className="header-action-section">
            <div>
              <Form>
                <Form.Check
                  type="switch"
                  id="thememode-switch"
                  onChange={(e) => {
                    e.target.checked
                      ? setDarkmodeflag("dark")
                      : setDarkmodeflag("light");
                  }}
                />
              </Form>
            </div>
            {showConnectButton === "block" ? (
              <div onClick={async () => login()}>Connect to Metamask</div>
            ) : null}
            {showConnectButton === "block" ? null : (
              <div
                onClick={() => {
                  if (activeChat && activeChat.publicKey)
                    getMessage(activeChat.publicKey);
                }}
              >
                <i className="fa fa-refresh"></i>
              </div>
            )}
          </div>
        </div>
        <Container>
          <div className="main-chat-section">{Messages}</div>
          <div className="main-chat-footer">
            <input
              type="text"
              placeholder="Send message"
              value={inputtext}
              onChange={(e) => setInputtext(e.target.value)}
            />
            <button type="button" onClick={() => sendMessage(inputtext)}>
              <i className="fa fa-send"></i>
            </button>
          </div>
        </Container>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title> Add New Friend </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Control
              required
              id="addPublicKey"
              size="text"
              type="text"
              placeholder="Enter Friends Public Key"
            />
            <br />
            <Form.Control
              required
              id="addName"
              size="text"
              type="text"
              placeholder="Name"
            />
            <br />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              addChat(
                document.getElementById("addName").value,
                document.getElementById("addPublicKey").value
              );
              handleClose();
            }}
          >
            Add Friend
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
