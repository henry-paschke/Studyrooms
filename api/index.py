from datetime import datetime, timezone
from fastapi import FastAPI
from prisma import Prisma
from pydantic import BaseModel
from contextlib import asynccontextmanager
import hashlib
import time
import openai
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env
client = openai.OpenAI(
    api_key=os.getenv("OPENAI_KEY")
)  # Ensure you have an API client instance


def is_safe_for_work(message, threshold=0.01):  # Set sensitivity level
    response = client.moderations.create(input=message, model="omni-moderation-latest")

    results = response.results[0]  # Get first moderation result
    scores = results.category_scores  # Object containing category scores

    # Convert categories and scores to dictionaries
    category_scores = vars(scores)

    flagged = True

    # Detect any flagged category OR any category score exceeding the threshold
    for entry in category_scores:
        if category_scores[entry] > threshold:
            flagged = False

    return flagged  # Safe message


### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

prisma = Prisma()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()


app = FastAPI(lifespan=lifespan)


class CreateUser(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str


class LoginUser(BaseModel):
    email: str
    password: str


class CreateRoom(BaseModel):
    email: str
    title: str


class FetchAllRooms(BaseModel):
    email: str


class DeleteRoom(BaseModel):
    roomId: str


class FetchRoster(BaseModel):
    roomId: str


class JoinRoom(BaseModel):
    userId: int
    roomId: str


class LeaveRoom(BaseModel):
    userId: int
    roomId: str


class FetchMessages(BaseModel):
    userId: int
    roomId: str


class FetchId(BaseModel):
    userEmail: str


class SendMessage(BaseModel):
    userId: int
    roomId: str
    content: str
    image: bool


class DeleteMessage(BaseModel):
    messageId: int
    userId: int


class FetchTheme(BaseModel):
    roomId: str


@app.post("/api/py/create-user")
async def create_user(user: CreateUser):
    try:
        # Email taken
        if await prisma.query_raw(
            'SELECT * FROM "User" WHERE "email" = $1', user.email
        ):
            # Return 404
            return {"status": 404}

        # Email doesn't have @
        if "@" not in user.email:
            # Return 405
            return {"status": 405}

        # Password length < 8
        if len(user.password) < 8:
            # Return 406
            return {"status": 406}

        # First name length < 1
        if len(user.firstName) < 1:
            # Return 407
            return {"status": 407}

        # Last name length < 1
        if len(user.lastName) < 1:
            # Return 408
            return {"status": 408}

        # Create user
        await prisma.user.create(
            data={
                "email": user.email,
                "password": user.password,
                "firstName": user.firstName,
                "lastName": user.lastName,
            }
        )
        # Return 200
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/login-user")
async def login_user(user: LoginUser):
    try:
        # User not found
        if not await prisma.query_raw(
            'SELECT * FROM "User" WHERE "email" = $1 AND "password" = $2',
            user.email,
            user.password,
        ):
            # Return 404
            return {"status": 404}
        # Return 200
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/fetch-theme")
async def fetch_theme(user: FetchTheme):
    try:
        # Fetch theme
        theme = await prisma.query_first(
            'SELECT "theme" FROM "Room" WHERE "roomId" = $1', user.roomId
        )

        # Theme wasn't found
        if not theme:
            # Return 404
            return {"status": 404}
        # Return 200
        return {"status": 200, "theme": theme["theme"]}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/create-room")
async def create_room(user: CreateRoom):
    try:
        # User not found
        userId = await prisma.query_first(
            'SELECT "userId" FROM "User" WHERE "email" = $1',
            user.email,
        )

        # If no user found
        if not userId:
            return {"status": 400}

        # Fetch the userId
        userId = userId["userId"]

        # Title too short or too long
        if len(user.title) < 1 or len(user.title) > 75:
            return {"status": 401}

        # Create random hash value
        hash_object = hashlib.sha1()
        hash_object.update(str(time.time() + userId).encode("utf-8"))
        roomId = hash_object.hexdigest()[:6]

        # Create a room
        await prisma.query_raw(
            'INSERT INTO "Room" ("roomId", "title", "adminId", "theme") VALUES ($1, $2, $3, $4)',
            roomId,
            user.title,
            userId,
            "default",
        )

        # Create a membership
        await prisma.query_raw(
            'INSERT INTO "Membership" ("userId", "roomId", "admin") VALUES ($1, $2, $3)',
            userId,
            roomId,
            True,
        )

        # Return 200
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/fetch-all-rooms")
async def fetch_all_rooms(user: FetchAllRooms):
    try:
        # User not found
        userId = await prisma.query_first(
            'SELECT "userId" FROM "User" WHERE "email" = $1',
            user.email,
        )

        # If no user found
        if not userId:
            return {"status": 400}

        # Fetch the userId
        userId = userId["userId"]

        # Fetch all rooms
        rooms = await prisma.query_raw(
            'SELECT "Room"."title", "Room"."roomId", "Room"."adminId", "User"."firstName", "User"."lastName" '
            'FROM "Room" '
            'JOIN "User" ON "Room"."adminId" = "User"."userId" '
            'WHERE "roomId" IN (SELECT "roomId" FROM "Membership" WHERE "userId" = $1)',
            userId,
        )

        # Return 200
        return {"status": 200, "rooms": rooms}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/delete-room")
async def delete_room(user: DeleteRoom):
    try:
        await prisma.query_first(
            'DELETE FROM "Room" WHERE "roomId" = $1',
            user.roomId,
        )
        await prisma.query_first(
            'DELETE FROM "Membership" WHERE "roomId" = $1',
            user.roomId,
        )
        await prisma.query_first(
            'DELETE FROM "Message" WHERE "roomId" = $1',
            user.roomId,
        )
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/fetch-roster")
async def fetch_roster(user: FetchRoster):
    try:
        results = await prisma.query_raw(
            'SELECT "User"."userId", "User"."firstName", "User"."lastName", "Membership"."admin" FROM "User" '
            'JOIN "Membership" ON "Membership"."userId" = "User"."userId" '
            'WHERE "Membership"."roomId" = $1 '
            'ORDER BY "Membership"."admin" DESC',
            user.roomId,
        )

        # No results found
        if not results:
            return {"status": 404}

        return {"status": 200, "data": results}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/join-room")
async def join_room(user: JoinRoom):
    try:
        # Validate room code
        room = await prisma.query_raw(
            'SELECT * FROM "Room" WHERE "roomId" = $1',
            user.roomId,
        )

        # Room code does not exist
        if not room:
            # Return 401
            return {"status": 401}

        # Make sure user is not already a member
        inRoom = await prisma.query_raw(
            'SELECT * FROM "Membership" WHERE "roomId" = $1 AND "userId" = $2',
            user.roomId,
            user.userId,
        )

        # User already in room
        if inRoom:
            # Return 402
            return {"status": 402}

        # Create membership
        await prisma.query_raw(
            'INSERT INTO "Membership" ("userId", "roomId", "admin") VALUES ($1, $2, FALSE)',
            user.userId,
            user.roomId,
        )
        # Return 200
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/leave-room")
async def leave_room(user: LeaveRoom):
    try:
        await prisma.query_raw(
            'DELETE FROM "Membership" WHERE "userId" = $1 AND "roomId" = $2',
            user.userId,
            user.roomId,
        )
        await prisma.query_first(
            'DELETE FROM "Message" WHERE "userId" = $1 AND "roomId" = $2',
            user.userId,
            user.roomId,
        )
        return {"status": 200}
    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400}


@app.post("/api/py/fetch-id")
async def fetch_id(email: FetchId):
    # info: FetchMessages
    try:
        id_record = await prisma.query_raw(
            'SELECT "userId" FROM "User" WHERE "email" = $1', email.userEmail
        )
        if id_record == None:
            return {"status": 400, "error": "No such user has that email"}

        user_id = id_record[0]["userId"]

        return {"status": 200, "id": user_id}

    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400, "error": str(error)}


@app.post("/api/py/fetch-messages")
async def fetch_messages(info: FetchMessages):
    try:
        membership = await prisma.query_raw(
            'SELECT * FROM "Membership" WHERE "userId" = $1 AND "roomId" = $2',
            info.userId,
            info.roomId,
        )

        if len(membership) == 0:
            # Return 404 if not in that room
            return {"status": 401, "error": "Not a member of that room!"}

        messages = await prisma.query_raw(
            """
            SELECT
                m."messageId" AS "messageId",
                u."userId" AS "id",
                u."firstName" || ' ' || u."lastName" AS "name",
                m."image" AS "image",
                m."message" AS "message",
                m."flagged" as "flagged"
            FROM "Message" m
            JOIN "User" u ON m."userId" = u."userId"
            JOIN "Membership" mshp ON mshp."userId" = u."userId"
            WHERE mshp."roomId" = $1 
                AND (m."flagged" = FALSE 
                    OR m."userId" = $2 
                    OR (SELECT "adminId" FROM "Room" WHERE "roomId" = $1) = $2)
                AND m."roomId" = $1
            ORDER BY m."date" ASC
            """,
            info.roomId,
            info.userId,
        )

        return {"status": 200, "messages": messages}

    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400, "error": str(error)}


@app.post("/api/py/delete-message")
async def delete_message(data: DeleteMessage):
    try:
        # Delete the message if it belongs to the user
        deleted_message = await prisma.execute_raw(
            """DELETE FROM "Message" 
                WHERE "messageId" = $1 
                AND (
                    "userId" = $2 OR 
                    (SELECT "adminId" FROM "Room" WHERE "roomId" = 
                        (SELECT "roomId" FROM "Message" WHERE "messageId" = $1)
                    ) = $2
                ) RETURNING *
            """,
            data.messageId,
            data.userId,
        )

        if deleted_message:
            return {"status": 200, "message": "Message deleted successfully"}
        else:
            return {"status": 404, "error": "Message not found or unauthorized"}

    except Exception as error:
        print(error)
        return {"status": 400, "error": str(error)}


@app.post("/api/py/approve-message")
async def approve_message(
    data: DeleteMessage,
):  # Consider renaming DeleteMessage to a more appropriate model
    try:
        # Approve the message by setting flagged = false if it belongs to the user
        updated_message = await prisma.execute_raw(
            """UPDATE "Message" SET "flagged" = false
                WHERE "messageId" = $1 
                AND (
                    "userId" = $2 OR 
                    (SELECT "adminId" FROM "Room" WHERE "roomId" = 
                        (SELECT "roomId" FROM "Message" WHERE "messageId" = $1)
                    ) = $2
                ) RETURNING *
            """,
            data.messageId,
            data.userId,
        )

        if updated_message:
            return {"status": 200, "message": "Message approved successfully"}
        else:
            return {"status": 404, "error": "Message not found or unauthorized"}

    except Exception as error:
        print(error)
        return {"status": 400, "error": str(error)}


@app.post("/api/py/send-message")
async def send_messages(data: SendMessage):
    try:
        membership = await prisma.query_raw(
            'SELECT * FROM "Membership" WHERE "userId" = $1 AND "roomId" = $2',
            data.userId,
            data.roomId,
        )

        if len(membership) == 0:
            # Return 404 if not in that room
            return {"status": 401, "error": "Not a member of that room!"}

        sfw = is_safe_for_work(data.content)

        # print(len(data.content))
        # data.content = compress_image(data.content, 1)
        # print(len(data.content))

        message = await prisma.message.create(
            data={
                "userId": data.userId,
                "roomId": data.roomId,
                "message": data.content,  # Store as Bytes
                "date": datetime.now(timezone.utc),
                "flagged": not sfw,
                "image": data.image,
            }
        )
        return {"status": 200, "messageId": message.messageId}

    except Exception as error:
        print(error)
        # Return 400
        return {"status": 400, "error": str(error)}


@app.post("/api/py/delete-message")
async def delete_message(data: DeleteMessage):
    try:
        # Delete the message if it belongs to the user
        deleted_message = await prisma.execute_raw(
            'DELETE FROM "Message" WHERE "messageId" = $1 AND "userId" = $2 RETURNING *',
            data.messageId,
            data.userId,
        )

        if deleted_message:
            return {"status": 200, "message": "Message deleted successfully"}
        else:
            return {"status": 404, "error": "Message not found or unauthorized"}

    except Exception as error:
        print(error)
        return {"status": 400, "error": str(error)}
