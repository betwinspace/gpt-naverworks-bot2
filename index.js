// ✅ GPT + Naver Works 자동 Access Token 재발급 포함 버전

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const qs = require("qs");
require("dotenv/config");

const app = express();
app.use(bodyParser.json());

let currentAccessToken = null;

// 🔐 1. JWT 생성 함수
function generateJWT() {
  const privateKey = fs.readFileSync("private-key.key");
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: process.env.CLIENT_ID,
    sub: process.env.SERVICE_ACCOUNT,
    aud: "https://auth.worksmobile.com/oauth2/v2.0/token",
    iat: now,
    exp: now + 60 * 10, // 10분짜리 JWT
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });

  console.log("🪙 생성된 JWT 토큰:", token);

  return token;
}
// 🔐 2. Access Token 발급
async function fetchAccessToken() {
  const jwtToken = generateJWT();

  const response = await axios.post(
    "https://auth.worksmobile.com/oauth2/v2.0/token",
    qs.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtToken,
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  currentAccessToken = response.data.access_token;
  console.log("✅ Access Token 갱신 완료");
}

// ⏰ 3. 23시간마다 자동 갱신
fetchAccessToken();
setInterval(fetchAccessToken, 1000 * 60 * 60 * 23);

// 🤖 GPT 호출
async function askGPT(question) {
  const manual = fs.readFileSync("manual.txt", "utf-8");

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `너는 우리 회사 규정 기반 챗봇이다. 아래는 공식 매뉴얼이다.\n\n${manual}\n\n규정에 없는 정보는 절대 응답하지 말고, 반드시 '해당 내용은 회사 매뉴얼에 없습니다.'라고만 말하라.`,
        },
        { role: "user", content: question },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0].message.content;
}

// 💬 Naver Works 메시지 전송
async function sendToNaverWorks(userId, text) {
  await axios.post(
    `https://www.worksapis.com/v1.0/bots/${process.env.BOT_ID}/users/${userId}/messages`,
    {
      content: {
        type: "text",
        text: text,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${currentAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// 📬 메시지 수신
app.post("/bot", async (req, res) => {
  const message = req.body.content.text;
  const userId = req.body.source.userId;

  try {
    const gptReply = await askGPT(message);
    await sendToNaverWorks(userId, gptReply);
    res.status(200).send("OK");
  } catch (err) {
    console.error("에러 발생:", err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 봇 서버가 포트 ${PORT}에서 실행 중입니다.`);
});
