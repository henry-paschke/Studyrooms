"use client";

import { useEffect, useState, useRef } from "react";
import { getSession } from "../functions/cookies";
import styles from "./rooms.module.css";
import hashToRGB from "../functions/hashToRgb";
import Button from "@/components/Button";
import {
  TrashIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

export default function Rooms() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [displayOption, setDisplayOption] = useState("");
  const [rooms, setRooms] = useState<null | Array<{
    roomId: string;
    title: string;
    adminId: number;
    firstName: string;
    lastName: string;
  }>>(null);
  const joinInputRef = useRef<HTMLInputElement | null>(null);
  const createRoomRef = useRef<HTMLInputElement | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  // Create a room
  async function createRoom() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/create-room",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, title: title }),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();
    if (data.status == 200) {
      setDisplayOption("");
      fetchAllRooms();
    } else if (data.status == 401) {
      setAlertMessage("Room name must be between 1-75 characters!");
      setAlertType("error");
    } else {
      setAlertMessage("Server error!");
      setAlertType("error");
    }
  }

  // Fetch all rooms
  async function fetchAllRooms() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/fetch-all-rooms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();

    if (data.status == 200) {
      setRooms(data.rooms);
    }
  }

  // Set the user id and email
  async function getUserId() {
    const session = await getSession();
    if (session && session.email && session.id) {
      setUserEmail(session.email as string);
      setUserId(session.id as number);
    } else {
      window.location.href = "/login";
    }
  }

  // Delete room
  async function deleteRoom(roomId: string) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/delete-room",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomId }),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();

    if (data.status == 200) {
      fetchAllRooms();
    }
  }

  // Join a room
  async function joinRoom() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/join-room",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId, roomId: roomCode }),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();

    if (data.status == 200) {
      setDisplayOption("");
      fetchAllRooms();
    } else if (data.status == 401) {
      setAlertMessage("Invalid room code!");
      setAlertType("error");
    } else if (data.status == 402) {
      setAlertMessage("Already in room!");
      setAlertType("error");
    } else {
      setAlertMessage("Server error!");
      setAlertType("error");
    }
  }

  // Leave a room
  async function leaveRoom(roomId: string) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/leave-room",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId, roomId: roomId }),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();

    if (data.status == 200) {
      fetchAllRooms();
    }
  }

  // Set the user id and email on render
  useEffect(() => {
    getUserId();
  }, []);

  // Fetch all rooms once the user is authenticated
  useEffect(() => {
    if (userEmail) {
      fetchAllRooms();
    }
  }, [userEmail]);

  return (
    <div
      className={`${styles.pageContainer} ${styles.scrollbarthin} animate__animated animate__fadeIn animate__slow overflow-y-auto`}
    >
      <div className={styles.initialButtonContainer}>
        <div>
          <Button
            onClick={() => {
              setTitle("");
              setDisplayOption("create");
              if (createRoomRef && createRoomRef.current) {
                createRoomRef.current.value = "";
              }
              setAlertMessage("");
              setAlertType("");
            }}
          >
            Create Room
          </Button>
        </div>
        <div>
          <Button
            onClick={() => {
              setRoomCode("");
              setDisplayOption("join");
              if (joinInputRef && joinInputRef.current) {
                joinInputRef.current.value = "";
              }
              setAlertMessage("");
              setAlertType("");
            }}
          >
            Join Room
          </Button>
        </div>
      </div>
      <div
        className={styles.createRoomContainer}
        style={
          displayOption == "create"
            ? { opacity: 1, zIndex: 1 }
            : { opacity: 0, zIndex: -1 }
        }
      >
        <label className={styles.titleLabel}>
          Class Name <span>*</span>
        </label>
        <input
          ref={createRoomRef}
          className={styles.titleInput}
          type="text"
          placeholder="CSIS 3710"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        ></input>
        <div className={styles.createButtonContainer}>
          <Button
            bgColor="bg-red-200"
            hoverFromColor="from-white"
            hoverToColor="to-red-200"
            onClick={() => {
              setDisplayOption("");
            }}
          >
            Back
          </Button>
          <Button
            bgColor="bg-green-200"
            hoverFromColor="from-white"
            hoverToColor="to-green-200"
            onClick={() => {
              createRoom();
            }}
          >
            Create
          </Button>
        </div>
        {alertType == "error" && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <strong>Error: </strong> {alertMessage}
          </div>
        )}
      </div>
      <div
        className={styles.joinRoomContainer}
        style={
          displayOption == "join"
            ? { opacity: 1, zIndex: 1 }
            : { opacity: 0, zIndex: -1 }
        }
      >
        <label className={styles.roomCodeLabel}>
          Room Code <span>*</span>
        </label>
        <input
          ref={joinInputRef}
          className={styles.roomCodeInput}
          type="text"
          placeholder="ABCDEF"
          onChange={(event) => {
            setRoomCode(event.target.value);
          }}
        ></input>
        <div className={styles.joinButtonContainer}>
          <Button
            bgColor="bg-red-200"
            hoverFromColor="from-white"
            hoverToColor="to-red-200"
            onClick={() => {
              setDisplayOption("");
            }}
          >
            Back
          </Button>
          <Button
            bgColor="bg-green-200"
            hoverFromColor="from-white"
            hoverToColor="to-green-200"
            onClick={() => {
              joinRoom();
            }}
          >
            Join
          </Button>
        </div>
        {alertType == "error" && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            <strong>Error: </strong> {alertMessage}
          </div>
        )}
      </div>
      <AnimatePresence>
        {rooms?.map((room, index) => {
          return (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              key={index}
              className={styles.roomContainer}
              style={{
                background: `linear-gradient(-90deg, rgb(255, 255, 255) 97%, ${hashToRGB(
                  room.roomId
                )} 3%)`,
              }}
              onClick={() => {
                window.location.href =
                  "/roomchat?room=" + room.roomId + "&roomname=" + room.title;
              }}
            >
              <div className={styles.roomLeftContainer}>
                <p>{room.title}</p>
                {userId == room.adminId && <p>{room.roomId}</p>}
              </div>
              <div className={styles.roomRightContainer}>
                <p>{room.firstName + " " + room.lastName}</p>
                {room.adminId == userId ? (
                  <TrashIcon
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteRoom(room.roomId);
                    }}
                    className={styles.trashIcon}
                    color="red"
                    width="20"
                    height="20"
                  ></TrashIcon>
                ) : (
                  <ArrowLeftStartOnRectangleIcon
                    onClick={(event) => {
                      event.stopPropagation();
                      leaveRoom(room.roomId);
                    }}
                    className={styles.trashIcon}
                    color="red"
                    width="20"
                    height="20"
                  ></ArrowLeftStartOnRectangleIcon>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
