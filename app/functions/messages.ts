export type Message = {
  messageId: number;
  id: number;
  name: string;
  message: string;
  image: boolean;
  flagged: boolean;
};

export async function getMessages(
  userId: number,
  roomId: string
): Promise<Message[]> {
  // API call wrapper to get all of the data for messages given user and room
  const response = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL + "api/py/fetch-messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: userId, roomId: roomId }),
    }
  );

  const data = await response.json();
  return data.messages;
}

export async function sendMessage(
  userId: number,
  roomId: string,
  content: string,
  image: Boolean
) {
  // API call wrapper to send messages
  const response = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL + "api/py/send-message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        roomId: roomId,
        content: content,
        image: image,
      }),
    }
  );
}

export async function deleteMessage(userId: number, messageId: number) {
  // API call wrapper to get all of the data for messages given user and room
  const response = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL + "api/py/delete-message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, messageId }),
    }
  );

  const data = await response.json();
  console.log(data.messages);
  return data.messages;
}

export async function approveMessage(userId: number, messageId: number) {
  // API call wrapper to get all of the data for messages given user and room
  const response = await fetch(
    process.env.NEXT_PUBLIC_BASE_URL + "api/py/approve-message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, messageId }),
    }
  );

  const data = await response.json();
  console.log(data.messages);
  return data.messages;
}
