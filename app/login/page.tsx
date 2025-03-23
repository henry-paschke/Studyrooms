"use client";

import Button from "@/components/Button";
import { login } from "../functions/cookies";
import styles from "./login.module.css";

import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  // Function to login user
  async function loginUser() {
    const user = {
      email: email,
      password: password,
    };
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "api/py/login-user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );
    if (!response.ok) {
      console.log(response.status);
      return;
    }

    const data = await response.json();
    // Server error
    if (data.status == 400) {
      setAlertMessage("Server Error!");
      setAlertType("error");
    }
    // Success
    else if (data.status == 200) {
      setAlertMessage("Logged in!");
      setAlertType("success");
      // Set cookies
      await login(user.email);
      window.location.href = "/rooms";
    }
    // Invalid email/password
    else {
      setAlertMessage("Invalid email/password combination!");
      setAlertType("error");
    }
  }

  return (
    <div
      className={`${styles.pageContainer} animate__animated animate__fadeIn animate__slow`}
    >
      <div className={`${styles.inputContainer}`}>
        <label className={styles.emailLabel}>
          Email <span>*</span>
        </label>
        <input
          className={styles.emailInput}
          type="text"
          placeholder="johndoe@gmail.com"
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        ></input>
        <label className={styles.passwordLabel}>
          Password <span>*</span>
        </label>
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="123"
          onChange={(event) => {
            setPassword(event.target.value);
          }}
        ></input>
        <div className={styles.submit}>
          <Button
            onClick={() => {
              loginUser();
            }}
            bgColor="bg-gray-100"
            hoverFromColor="from-gray-100"
            hoverToColor="to-blue-300"
          >
            Login
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
        {alertType == "success" && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            <strong>Success: </strong> {alertMessage}
          </div>
        )}
      </div>
    </div>
  );
}
