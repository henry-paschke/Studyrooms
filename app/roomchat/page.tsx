"use client";

import { Suspense } from 'react';
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./roomchat.module.css";
import { stringToColor } from "../functions/colors";
import { getMessages, Message, sendMessage } from "../functions/messages";
import { getUserId } from "../functions/session";
import { motion, AnimatePresence } from "framer-motion";
import { approveMessage, deleteMessage } from "../functions/messages";
import {
  ArrowLeftCircleIcon,
  CheckIcon,
  PaperClipIcon,
  XMarkIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";

function RoomchatInner() {
  // URL parameters
  const searchParams = useSearchParams();
  const roomName = searchParams.get("roomname");
  const roomId = searchParams.get("room") as string;

  // State to track the input fields, message array, and current_user
  const [contentInput, setContentInput] = useState<string>("");
  const [fileInput, setFileInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const prevLength = useRef(0);
  const [userId, setuserId] = useState<number>();
  const [rosterOpen, setRosterOpen] = useState(false);
  const sideBarRef = useRef<HTMLDivElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string | null>(null);

  // Roster
  const [roster, setRoster] = useState<Array<{
    userId: number;
    firstName: string;
    lastName: string;
    admin: Boolean;
  }> | null>(null);

  // Ref to the messages container for scrolling
  const containerRef = useRef<HTMLDivElement | null>(null);

  //   // Scroll to the bottom whenever a new message appears
  //   useEffect(() => {
  //     if (containerRef.current) {
  //       containerRef.current.scrollTop = containerRef.current.scrollHeight;
  //     }
  //   }, [messages]);

  // query user id on page load
  useEffect(() => {
    getUserId().then((data: any) => {
      setuserId(data);
    });
  }, []);

  // load messages once every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        getMessages(userId, roomId).then((data) => {
          if (!data) {
            window.location.href = "/rooms";
          } else {
            setMessages(data);
          }
        });
      }
    }, 3000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, [userId]);

  useEffect(() => {
    if (!messages) {
      window.location.href = "/rooms";
    }
    if (messages.length > prevLength.current) {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
    prevLength.current = messages.length;
  }, [messages]);

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission (if inside a form)
      addMessage();
    }
  };

  // Function to handle adding a new message
  const addMessage = () => {
    if (userId) {
      if (contentInput) {
        sendMessage(userId, roomId, contentInput, false);
        setContentInput("");
      }
      if (fileInput) {
        sendMessage(userId, roomId, fileInput, true);
        setFileInput("");
      }
    }
  };

  // Fetch roster
  async function fetchRoster(roomId: string) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/fetch-roster",
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
      setRoster(data.data);
    }
  }

  // Fetch roster
  useEffect(() => {
    fetchRoster(roomId);
  }, []);

  // Handle image upload to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = () => {
      if (reader.result && typeof reader.result === "string") {
        // Convert image to base64 string and set it
        setFileInput(reader.result);
      }
    };
  };

  // Leave a room
  async function leaveRoom(userId: number) {
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
      fetchRoster(roomId);
    }
  }

  // Fetch theme
  async function fetchTheme() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/fetch-theme",
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
      setTheme(data.theme);
    }
  }

  // Fetch theme
  useEffect(() => {
    fetchTheme();
  }, []);

  // Custom color theme
  const getThemeGradient = (theme: string): string => {
    const gradients: { [key: string]: [string, string] } = {
      default: ["#2563eb", "#60a5fa"],
      halloween: ["#FF7518", "#5A189A"],
      christmas: ["#DC2626", "#16A34A"],
      easter: ["#FDE68A", "#A7F3D0"],
      summer: ["#FDE047", "#F97316"],
      winter: ["#3B82F6", "#60A5FA"],
    };

    const [color1, color2] = gradients[theme.toLowerCase()] || [
      "#E5E7EB",
      "#9CA3AF",
    ];

    return `background: linear-gradient(to bottom, white, ${color1}, ${color2})`;
  };

  return (
    <>
      {theme && (
        <div
          style={{ background: getThemeGradient(theme) }}
          className="relative w-full h-full overflow-hidden animate__animated animate__fadeIn animate__slow"
        >
          <div
            className={styles.rosterSidebar}
            ref={sideBarRef}
            style={
              rosterOpen
                ? { transform: "translateX(-300px)" }
                : { transform: "translateX(0px)" }
            }
          >
            <div className={styles.rosterContainer}>
              <div className={styles.adminContainer}>Admin</div>
              {roster?.map((person, index) => {
                return (
                  <div key={index}>
                    {person.admin && (
                      <div className="font-bold">
                        {person.firstName + " " + person.lastName}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className={styles.studentContainer}>Student</div>
              {roster?.map((person, index) => {
                return (
                  <div key={index} className={styles.rosterStudent}>
                    {!person.admin && (
                      <>
                        {" "}
                        <div>{person.firstName + " " + person.lastName}</div>
                        {roster[0].userId == userId && (
                          <UserMinusIcon
                            className={styles.deletePerson}
                            onClick={() => {
                              leaveRoom(person.userId);
                            }}
                            width="15"
                            height="15"
                            color="white"
                          ></UserMinusIcon>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            ref={containerRef}
            className={`flex flex-col space-y-4 overflow-auto h-[85%] mr-[5px] relative ${styles.scrollbarthin}`}
          >
            <div
              ref={navBarRef}
              className={`w-[90%] h-[50px] min-h-[50px] text-2xl font-bold bg-white rounded-xl text-black mt-[5px] shadow-md px-3 py-2 sticky top-5 mx-auto flex items-center border-1 border-black justify-between ${styles.navbarContainer}`}
            >
              <div className={styles.navbarLeft}>
                <ArrowLeftCircleIcon
                  height={25}
                  width={25}
                  className="inline mr-5 hover:cursor-pointer"
                  onClick={() => {
                    window.location.href = "/rooms";
                  }}
                ></ArrowLeftCircleIcon>
                <p className="m-0">Room:&nbsp;</p>
                <p className="m-0">{roomName}</p>
              </div>
              <button
                onClick={() => {
                  setRosterOpen((prev) => {
                    return !prev;
                  });
                }}
                className="text-white rounded-md p-[5px] bg-[rgb(100,90,165)] mr-[5px]"
              >
                Roster
              </button>
            </div>
            <div className="min-h-[30px]"></div>
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.li
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  key={index}
                  className={`flex items-start mx-4 ${
                    msg.id === userId ? "justify-end" : ""
                  }`}
                >
                  {
                    <div
                      className={`text-black px-2 py-1 rounded-xl max-w-xs break-words border-white border-[1px] ${
                        msg.flagged ? "bg-red-200" : "bg-white"
                      }`}
                    >
                      <p
                        className="px-3 py-1 font-bold rounded-xl w-fit"
                        style={{
                          backgroundColor: stringToColor(msg.name),
                          color: "white",
                        }}
                      >
                        {msg.name}
                      </p>
                      {msg.image ? (
                        <img src={msg.message}></img>
                      ) : (
                        <p>{msg.message}</p>
                      )}
                      {msg.flagged && userId && (
                        <>
                          <button
                            onClick={() => deleteMessage(userId, msg.messageId)}
                            className="px-3 py-2 text-white transition bg-red-400 rounded-lg hover:bg-red-500"
                          >
                            <XMarkIcon className="inline w-6 h-6" />
                          </button>
                          {roster &&
                            roster[0] &&
                            roster[0].userId == userId && (
                              <button
                                onClick={() =>
                                  approveMessage(userId, msg.messageId)
                                }
                                className="px-3 py-2 text-white transition bg-green-400 rounded-lg hover:bg-green-500"
                              >
                                <CheckIcon className="inline w-6 h-6" />
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  }
                </motion.li>
              ))}
            </AnimatePresence>
            <div className="h-[30px]"></div>
          </div>

          <div className="flex items-center space-x-2 bg-white h-[10%] justify-center rounded-xl mx-[5px] p-3 ml-[24px] mr-[33px]">
            <label className="p-2 text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300">
              {fileInput ? (
                <img src={fileInput} className="w-[25px] h-[25px]"></img>
              ) : (
                <PaperClipIcon width="25" height="25"></PaperClipIcon>
              )}
              <input
                onChange={(event) => {
                  handleImageUpload(event);
                }}
                type="file"
                className="hidden"
              />
            </label>
            <input
              type="text"
              placeholder="Message"
              value={contentInput}
              onKeyDown={handleKeyDown}
              onChange={(e) => setContentInput(e.target.value)}
              className="flex-grow p-2 text-black border rounded-md"
            />
            <button
              onClick={addMessage}
              className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}


export default function Roomchat() {
  return (
    <Suspense fallback={<div>Loading room chat...</div>}>
      <RoomchatInner />
    </Suspense>
  );
}